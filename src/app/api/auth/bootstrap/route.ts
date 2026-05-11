import { logEvent } from "@/lib/analytics";
import { generateReferralCode } from "@/lib/referral-code";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { suggestUsernameFromStartup } from "@/lib/username";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  country: z.string().min(1),
  startup_name: z.string().min(1),
  found_us: z.string().min(1),
  ref_code: z.string().optional().nullable(),
  session_id: z.string().optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceRoleClient();
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, created: false });
  }

  const b = parsed.data;
  if (b.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Email mismatch" }, { status: 400 });
  }

  let referralCode = generateReferralCode();
  let referredBy: string | null = null;
  let foundingFromReferrer = false;

  if (b.ref_code) {
    const { data: refUser } = await admin
      .from("users")
      .select("id, founding_member")
      .eq("referral_code", b.ref_code.trim())
      .maybeSingle();
    if (refUser && refUser.id !== user.id) {
      referredBy = refUser.id;
      foundingFromReferrer = !!refUser.founding_member;
    }
  }

  const founding_member =
    b.found_us === "Reddit" || foundingFromReferrer;

  let username = suggestUsernameFromStartup(b.startup_name);

  for (let attempt = 0; attempt < 24; attempt++) {
    const { error } = await admin.from("users").insert({
      id: user.id,
      email: b.email,
      username,
      full_name: b.full_name,
      country: b.country,
      startup_name: b.startup_name,
      found_us: b.found_us,
      stage: "",
      mrr: "",
      startup_description: "",
      referral_code: referralCode,
      referred_by: referredBy,
      founding_member,
    });

    if (!error) break;
    if (error.message?.includes("duplicate") || error.code === "23505") {
      referralCode = generateReferralCode();
      username = suggestUsernameFromStartup(b.startup_name);
      continue;
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (referredBy) {
    await admin.from("referrals").insert({
      referrer_user_id: referredBy,
      referred_user_id: user.id,
      referral_code: b.ref_code?.trim() ?? "",
      signup_completed: true,
      flagged_for_review: false,
    });
  }

  await logEvent(
    "signup_completed",
    {
      method: "email",
      country: b.country,
      found_us: b.found_us,
      has_referral: !!referredBy,
    },
    user.id,
    parsed.data.session_id ?? "web",
  );

  return NextResponse.json({ ok: true, created: true, referral_code: referralCode });
}
