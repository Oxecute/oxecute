import type { SupabaseClient } from "@supabase/supabase-js";

/** Milestone referral notifications - onboarding tiers at thresholds (brief §12). */
export async function detectReferralRewards(
  supabase: SupabaseClient,
  referrerUserId: string,
) {
  const { data: rows } = await supabase
    .from("referrals")
    .select("id, onboarding_completed")
    .eq("referrer_user_id", referrerUserId);

  const onboarded = (rows ?? []).filter((r) => r.onboarding_completed).length;

  const { data: existing } = await supabase
    .from("referral_rewards")
    .select("tier_reached")
    .eq("user_id", referrerUserId);

  const have = new Set((existing ?? []).map((r) => r.tier_reached));

  const maybe = async (
    threshold: number,
    tier: string,
    reward_type: string,
    reward_value: number,
    title: string,
    body: string,
  ) => {
    if (onboarded < threshold || have.has(tier)) return;
    await supabase.from("referral_rewards").insert({
      user_id: referrerUserId,
      tier_reached: tier,
      reward_type,
      reward_value,
    });
    await supabase.from("notifications").insert({
      user_id: referrerUserId,
      type: "referral",
      title,
      body,
    });
    have.add(tier);
  };

  await maybe(
    1,
    "1_onboarded",
    "pct_off_one_month",
    25,
    "1 founder onboarded through your link - 25% off locked",
    "Claim at 21 days executed.",
  );
  await maybe(
    3,
    "3_onboarded",
    "pct_off_one_month",
    50,
    "3 founders onboarded through your link - 50% off locked",
    "Claim at 21 days executed.",
  );
  await maybe(
    5,
    "5_onboarded",
    "free_month",
    1,
    "5 founders onboarded - 1 month free locked",
    "Claim at 21 days executed.",
  );
}
