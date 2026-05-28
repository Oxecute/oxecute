import { mergeBreakDayNumbers } from "@/lib/break-days";
import { getAcknowledgment } from "@/lib/conexa/acknowledgments";
import { sha256Hex } from "@/lib/crypto";
import { executionDayNumber, utcTodayISO } from "@/lib/dates";
import { detectReferralRewards } from "@/lib/referral-rewards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { validateProofUrl } from "@/lib/url-validation";
import { assertValidUploadPathsForUser } from "@/lib/entry-uploads";
import { logEvent } from "@/lib/analytics";
import { NextResponse } from "next/server";
import { z } from "zod";

async function urlNotDuplicateExcept(
  admin: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  url: string,
  exceptEntryId?: string,
) {
  const q = admin.from("entries").select("id").eq("user_id", userId).eq("url", url).limit(1);
  const { data } = exceptEntryId ? await q.neq("id", exceptEntryId) : await q;
  return !data?.length;
}

const declarationUploadPaths = z.array(z.string().min(1).max(512)).max(3).optional();
const uploadPathListRequired = z.array(z.string().min(1).max(512)).min(1).max(3);

const postSchema = z.discriminatedUnion("path", [
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
    upload_paths: declarationUploadPaths,
  }),
  z.object({
    path: z.literal("upload"),
    context_text: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.string().min(30).max(140),
    ),
    category: z.enum(["product", "distribution", "ops"]),
    upload_paths: uploadPathListRequired,
  }),
]);

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createServiceRoleClient();
  const [{ data }, { data: breakRows }, { data: breakNotifs }] = await Promise.all([
    admin
      .from("entries")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_number", { ascending: true }),
    admin.from("break_marks").select("day_number").eq("user_id", user.id),
    admin
      .from("notifications")
      .select("title")
      .eq("user_id", user.id)
      .ilike("title", "Break mark written%"),
  ]);
  const break_days = mergeBreakDayNumbers(breakRows, breakNotifs);
  return NextResponse.json({ entries: data ?? [], break_days });
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

  const json = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const hint =
      first?.path.join(".") === "declaration_text" || first?.path.join(".") === "context_text"
        ? "Declaration must be 30–140 characters (after trimming spaces)."
        : (first?.message ?? "Invalid input");
    return NextResponse.json({ error: hint }, { status: 400 });
  }

  let declarationUploadPathsResolved: string[] | null = null;
  let uploadProofPathsResolved: string[] | null = null;
  if (parsed.data.path === "declaration") {
    try {
      declarationUploadPathsResolved = assertValidUploadPathsForUser(
        parsed.data.upload_paths,
        user.id,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid attachments";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } else if (parsed.data.path === "upload") {
    try {
      uploadProofPathsResolved = assertValidUploadPathsForUser(parsed.data.upload_paths, user.id);
      if (!uploadProofPathsResolved?.length) {
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

  const { data: daySlot } = await admin
    .from("entries")
    .select("id, entry_number, tier")
    .eq("user_id", user.id)
    .eq("day_number", dayNum)
    .maybeSingle();

  const submittedToday = profile.last_submission_date === today;
  const canUpgradeSignup =
    submittedToday && daySlot?.tier === "signup_execution";

  if (submittedToday && !canUpgradeSignup) {
    return NextResponse.json(
      {
        error:
          "Already submitted today (UTC). Your signup already locked Day 1 - next window opens at midnight UTC.",
      },
      { status: 400 },
    );
  }

  const { data: last } = await admin
    .from("entries")
    .select("entry_number")
    .eq("user_id", user.id)
    .order("entry_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextEntry = (last?.entry_number ?? 0) + 1;
  const createdAtIso = new Date().toISOString();

  let tier: string;
  let source_type: string;
  let url: string | null = null;
  let declaration_text: string | null = null;
  const category: string = parsed.data.category;

  let insertError: { message: string; code?: string } | null = null;
  let responseEntryNumber = nextEntry;

  if (canUpgradeSignup && daySlot) {
    responseEntryNumber = daySlot.entry_number;

    if (parsed.data.path === "declaration") {
      tier = "declaration_pending";
      source_type = "declaration";
      declaration_text = parsed.data.declaration_text;
      const hash = await sha256Hex(declaration_text + createdAtIso);
      const { error } = await admin
        .from("entries")
        .update({
          category,
          source_type,
          tier,
          declaration_text,
          url: null,
          upload_paths: declarationUploadPathsResolved,
          validation_hash: hash,
          url_resolved_status: null,
          url_content_type: null,
          execution_day: true,
        })
        .eq("id", daySlot.id);
      if (error) insertError = error;
    } else if (parsed.data.path === "upload") {
      tier = "upload_unverified";
      source_type = "file_upload";
      declaration_text = parsed.data.context_text;
      const hash = await sha256Hex(
        (uploadProofPathsResolved ?? []).join("|") + declaration_text + createdAtIso,
      );
      const { error } = await admin
        .from("entries")
        .update({
          category,
          source_type,
          tier,
          declaration_text,
          context_sentence: parsed.data.context_text,
          upload_paths: uploadProofPathsResolved,
          url: null,
          validation_hash: hash,
          url_resolved_status: null,
          url_content_type: null,
          execution_day: true,
        })
        .eq("id", daySlot.id);
      if (error) insertError = error;
    } else {
      url = parsed.data.url;
      if (!(await urlNotDuplicateExcept(admin, user.id, url, daySlot.id))) {
        return NextResponse.json({ error: "Duplicate URL" }, { status: 400 });
      }
      const check = await validateProofUrl(url);
      if (!check.ok) {
        return NextResponse.json({ error: check.failureReason ?? "Bad URL" }, { status: 400 });
      }
      tier = "verified_proof";
      source_type = "manual_url";
      const hash = await sha256Hex(url + createdAtIso);
      const { error } = await admin
        .from("entries")
        .update({
          category,
          source_type,
          tier,
          url,
          declaration_text: null,
          upload_paths: null,
          validation_hash: hash,
          url_resolved_status: check.httpStatus,
          url_content_type: check.contentType ?? null,
          execution_day: true,
        })
        .eq("id", daySlot.id);
      if (error) insertError = error;
    }

    if (insertError) {
      const msg =
        insertError.code === "23505" ? "Could not replace signup placeholder." : insertError.message;
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    const ack = getAcknowledgment(tier, category);
    await logEvent(
      "entry_submitted",
      {
        tier,
        category,
        day_number: dayNum,
      },
      user.id,
      "web",
    );
    return NextResponse.json({
      ok: true,
      acknowledgment: ack,
      entry_number: responseEntryNumber,
      upgraded_from_signup: true,
    });
  }

  if (parsed.data.path === "declaration") {
    tier = "declaration_pending";
    source_type = "declaration";
    declaration_text = parsed.data.declaration_text;
    const hash = await sha256Hex(declaration_text + createdAtIso);
    const { error } = await admin.from("entries").insert({
      user_id: user.id,
      entry_number: nextEntry,
      day_number: dayNum,
      category,
      source_type,
      tier,
      declaration_text,
      upload_paths: declarationUploadPathsResolved,
      validation_hash: hash,
      execution_day: true,
    });
    if (error) insertError = error;
  } else if (parsed.data.path === "upload") {
    tier = "upload_unverified";
    source_type = "file_upload";
    declaration_text = parsed.data.context_text;
    const hash = await sha256Hex(
      (uploadProofPathsResolved ?? []).join("|") + declaration_text + createdAtIso,
    );
    const { error } = await admin.from("entries").insert({
      user_id: user.id,
      entry_number: nextEntry,
      day_number: dayNum,
      category,
      source_type,
      tier,
      declaration_text,
      context_sentence: parsed.data.context_text,
      upload_paths: uploadProofPathsResolved,
      validation_hash: hash,
      execution_day: true,
    });
    if (error) insertError = error;
  } else {
    url = parsed.data.url;
    if (!(await urlNotDuplicateExcept(admin, user.id, url))) {
      return NextResponse.json({ error: "Duplicate URL" }, { status: 400 });
    }
    const check = await validateProofUrl(url);
    if (!check.ok) {
      return NextResponse.json({ error: check.failureReason ?? "Bad URL" }, { status: 400 });
    }
    tier = "verified_proof";
    source_type = "manual_url";
    const hash = await sha256Hex(url + createdAtIso);
    const { error } = await admin.from("entries").insert({
      user_id: user.id,
      entry_number: nextEntry,
      day_number: dayNum,
      category,
      source_type,
      tier,
      url,
      validation_hash: hash,
      url_resolved_status: check.httpStatus,
      url_content_type: check.contentType ?? null,
      execution_day: true,
    });
    if (error) insertError = error;
  }

  if (insertError) {
    const msg =
      insertError.code === "23505"
        ? "You already have an entry for this execution day. One submission per UTC day."
        : insertError.message;
    return NextResponse.json({ error: msg }, { status: 409 });
  }

  await admin
    .from("users")
    .update({
      execution_count: (profile.execution_count ?? 0) + 1,
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

  const ack = getAcknowledgment(tier, category);
  await logEvent(
    "entry_submitted",
    {
      tier,
      category,
      day_number: dayNum,
    },
    user.id,
    "web",
  );
  return NextResponse.json({ ok: true, acknowledgment: ack, entry_number: responseEntryNumber });
}
