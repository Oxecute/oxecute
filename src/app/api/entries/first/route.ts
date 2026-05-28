import { getAcknowledgment } from "@/lib/conexa/acknowledgments";
import { sha256Hex } from "@/lib/crypto";
import { executionDayNumber, utcTodayISO } from "@/lib/dates";
import { logEvent } from "@/lib/analytics";
import { detectReferralRewards } from "@/lib/referral-rewards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { validateProofUrl } from "@/lib/url-validation";
import { assertValidUploadPathsForUser } from "@/lib/entry-uploads";
import { sendWelcomeEmail } from "@/lib/email/service";
import { NextResponse } from "next/server";
import { z } from "zod";

const uploadPathList = z.array(z.string().min(1).max(512)).min(1).max(3);

const jsonSchema = z.discriminatedUnion("path", [
  z.object({
    path: z.literal("verified"),
    url: z.string().url(),
    category: z.enum(["product", "distribution", "ops"]),
  }),
  z.object({
    path: z.literal("declaration"),
    declaration_text: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.string().min(30).max(140),
    ),
    category: z.enum(["product", "distribution", "ops"]),
  }),
  z.object({
    path: z.literal("upload"),
    context_text: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.string().min(30).max(140),
    ),
    category: z.enum(["product", "distribution", "ops"]),
    upload_paths: uploadPathList,
  }),
]);

async function urlNotDuplicate(
  admin: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  url: string,
) {
  const { data } = await admin
    .from("entries")
    .select("id")
    .eq("user_id", userId)
    .eq("url", url)
    .limit(1);
  return !data?.length;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceRoleClient();
  const { data: profile } = await admin.from("users").select("*").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const { data: existingEntry } = await admin
    .from("entries")
    .select("id")
    .eq("user_id", user.id)
    .eq("entry_number", 1)
    .maybeSingle();
  if (existingEntry) {
    return NextResponse.json({ error: "First entry already exists" }, { status: 409 });
  }

  const json = await request.json().catch(() => null);
  if (json === null || typeof json !== "object") {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = jsonSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const hint =
      first?.path.join(".") === "declaration_text" || first?.path.join(".") === "context_text"
        ? "Use 30–140 characters (after trimming spaces)."
        : first?.path.join(".") === "url"
          ? "Enter a valid proof URL (https://…)."
          : (first?.message ?? "Check your entry and try again.");
    return NextResponse.json({ error: hint }, { status: 400 });
  }

  let firstProofUploadPaths: string[] | null = null;
  if (parsed.data.path === "upload") {
    try {
      firstProofUploadPaths = assertValidUploadPathsForUser(
        parsed.data.upload_paths,
        user.id,
      );
      if (!firstProofUploadPaths?.length) {
        return NextResponse.json(
          { error: "At least one uploaded file is required." },
          { status: 400 },
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid attachments";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  const today = utcTodayISO();
  const dayNum = executionDayNumber(profile.created_at as string, new Date());
  let tier: string;
  let source_type: string;
  let url: string | null = null;
  let declaration_text: string | null = null;
  let category = "product";
  let validation_hash: string;
  const createdAtIso = new Date().toISOString();

  if (parsed.data.path === "declaration") {
    tier = "declaration_pending";
    source_type = "declaration";
    category = parsed.data.category;
    declaration_text = parsed.data.declaration_text;
    validation_hash = await sha256Hex(declaration_text + createdAtIso);
    await admin.from("entries").insert({
      user_id: user.id,
      entry_number: 1,
      day_number: dayNum,
      category,
      source_type,
      tier,
      declaration_text,
      validation_hash,
      execution_day: true,
    });
  } else if (parsed.data.path === "upload") {
    tier = "upload_unverified";
    source_type = "file_upload";
    category = parsed.data.category;
    declaration_text = parsed.data.context_text;
    validation_hash = await sha256Hex(
      (firstProofUploadPaths ?? []).join("|") + declaration_text + createdAtIso,
    );
    await admin.from("entries").insert({
      user_id: user.id,
      entry_number: 1,
      day_number: dayNum,
      category,
      source_type,
      tier,
      declaration_text,
      context_sentence: parsed.data.context_text,
      upload_paths: firstProofUploadPaths,
      validation_hash,
      execution_day: true,
    });
  } else {
    category = parsed.data.category;
    url = parsed.data.url;
    if (!(await urlNotDuplicate(admin, user.id, url))) {
      return NextResponse.json({ error: "Duplicate URL" }, { status: 400 });
    }
    const check = await validateProofUrl(url);
    if (!check.ok) {
      await logEvent(
        "first_entry_failed",
        { failure_reason: check.failureReason ?? "validation" },
        user.id,
        "web",
      );
      return NextResponse.json(
        { error: check.failureReason ?? "URL validation failed" },
        { status: 400 },
      );
    }
    tier = "verified_proof";
    source_type = "manual_url";
    validation_hash = await sha256Hex(url + createdAtIso);
    await admin.from("url_validations").insert({
      url,
      http_status: check.httpStatus,
      content_type: check.contentType ?? null,
      body_size_bytes: check.bodySize ?? null,
      passed: true,
    });
    await admin.from("entries").insert({
      user_id: user.id,
      entry_number: 1,
      day_number: dayNum,
      category,
      source_type,
      tier,
      url,
      validation_hash,
      url_resolved_status: check.httpStatus,
      url_content_type: check.contentType ?? null,
      execution_day: true,
    });
  }

  await admin
    .from("users")
    .update({
      execution_count: 1,
      last_submission_date: today,
    })
    .eq("id", user.id);

  await admin
    .from("referrals")
    .update({ onboarding_completed: true })
    .eq("referred_user_id", user.id);

  const { data: refRows } = await admin
    .from("referrals")
    .select("referrer_user_id")
    .eq("referred_user_id", user.id)
    .limit(1);

  if (refRows?.[0]?.referrer_user_id) {
    await detectReferralRewards(admin, refRows[0].referrer_user_id);
  }

  const report = profile.conexa_day1_report as { personal_insight?: string } | null;
  const insight =
    report?.personal_insight ??
    `Conexa has read your baseline. Your execution window opens at midnight.`;

  await sendWelcomeEmail(
    profile.email,
    String(profile.full_name).split(" ")[0],
    profile.username,
    insight,
  );

  await logEvent(
    "first_entry_submitted",
    {
      tier,
      category,
      source_type,
      validation_ms: 0,
    },
    user.id,
    "web",
  );

  const ack = getAcknowledgment(tier, category);

  return NextResponse.json({ ok: true, tier, acknowledgment: ack });
}
