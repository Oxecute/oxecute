import { conexaDay14Read } from "@/lib/conexa/anthropic";
import { executionDayNumber, executionRate, startOfUtcDay, utcTodayISO } from "@/lib/dates";
import {
  sendDay7Email,
  sendDay14Email,
  sendDay21Email,
  sendDay45Email,
  sendWindowClosingReminderEmail,
  sendZeroReferrerDay7Email,
  sendZeroReferrerDay14Email,
  sendZeroReferrerDay21Email,
  sendZeroReferrerDay28Email,
  sendZeroReferrerDay35Email,
  sendActiveReferrerRecurringEmail,
} from "@/lib/email/service";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { logEvent } from "@/lib/analytics";

async function acquireLock(job: string, dateKey: string): Promise<boolean> {
  const admin = createServiceRoleClient();
  const { data } = await admin.from("cron_locks").select("last_run_date").eq("job", job).maybeSingle();
  if (data?.last_run_date === dateKey) return false;
  await admin.from("cron_locks").upsert({ job, last_run_date: dateKey }, { onConflict: "job" });
  return true;
}

export async function runCronHeartbeat(overrideNow?: Date) {
  const admin = createServiceRoleClient();
  const now = overrideNow || new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const today = utcTodayISO();
  const dateKey = today;

  if (utcH === 0 && utcM === 0) {
    const ok = await acquireLock("days_increment", dateKey);
    if (ok) {
      await admin.rpc("increment_all_days_on_record");
    }
  }

  if (utcH === 23 && utcM === 59) {
    const ok = await acquireLock("break_marks", dateKey);
    if (ok) {
      const { data: users } = await admin.from("users").select("*");
      for (const u of users ?? []) {
        if (!u.created_at) continue;
        const created = new Date(u.created_at);
        if (startOfUtcDay(created).getTime() > startOfUtcDay(now).getTime()) continue;
        const dayNum = executionDayNumber(u.created_at as string, now);
        if (u.last_submission_date === today) continue;
        const { data: ent } = await admin
          .from("entries")
          .select("id")
          .eq("user_id", u.id)
          .eq("day_number", dayNum)
          .maybeSingle();
        if (ent) continue;
        const { data: br } = await admin
          .from("break_marks")
          .select("id")
          .eq("user_id", u.id)
          .eq("break_date", today)
          .maybeSingle();
        if (br) continue;
        await admin.from("break_marks").insert({
          user_id: u.id,
          break_date: today,
          day_number: dayNum,
          execution_count_before: u.execution_count ?? 0,
        });
        await admin
          .from("users")
          .update({ break_count: (u.break_count ?? 0) + 1 })
          .eq("id", u.id);
        await admin.from("notifications").insert({
          user_id: u.id,
          type: "record",
          title: `Break mark written - Day ${dayNum}`,
          body: `No submission on ${today}. This gap is part of your record.`,
        });
        await logEvent(
          "break_mark_written",
          { day_number: dayNum, execution_count_before: u.execution_count ?? 0 },
          u.id,
          "cron",
        );
      }
    }
  }

  const { data: candidates } = await admin
    .from("users")
    .select("*")
    .or("day7_reached.eq.false,day14_notified.eq.false,day21_reached.eq.false,day45_reached.eq.false");

  for (const u of candidates ?? []) {
    const ex = u.execution_count ?? 0;
    const firstName = String(u.first_name || u.full_name || "Founder").split(" ")[0];

    if (ex >= 7 && !u.day7_reached) {
      await admin
        .from("users")
        .update({ day7_reached: true, day7_reached_at: new Date().toISOString() })
        .eq("id", u.id);
      await admin.from("milestone_events").insert({
        user_id: u.id,
        milestone: "day7",
        execution_count_at: ex,
      });
      // Unified email helper also handles the database notification automatically!
      await sendDay7Email(u.email, firstName, u.referral_code || "");
      await logEvent("milestone_day7_reached", { execution_count: ex }, u.id, "cron");
    }
    if (ex >= 14 && !u.day14_notified) {
      const rate = executionRate(ex, u.created_at as string);
      const { data: entries } = await admin
        .from("entries")
        .select("day_number, category, tier, url, declaration_text")
        .eq("user_id", u.id)
        .order("day_number", { ascending: false })
        .limit(5);
      const lines =
        entries
          ?.map(
            (e) =>
              `${e.day_number} · ${e.category} · ${e.tier} · ${(e.url || e.declaration_text || "").slice(0, 60)}`,
          )
          .join("\n") ?? "";
      const msg = `Day 1 baseline:
Stage: ${u.stage} | MRR: ${u.mrr}
Q5 30-day unknown: ${u.cal_q5_unknown}
Avoidance pattern: ${(u.avoidance_tags as string[])?.join(", ")}
Biggest blocker: ${u.blocker_text}
14-day submission record:
Total entries: ${ex}
Breaks: ${u.break_count}
Execution rate: ${rate}%
Category breakdown: Product 0% / Distribution 0% / Ops 0%
Last 5 submissions:
${lines}`;
      let paragraph = "";
      try {
        const r = await conexaDay14Read(msg);
        paragraph = r.text;
      } catch {
        paragraph = "14 days executed. Mid-point read unavailable.";
      }
      await admin
        .from("users")
        .update({
          day14_notified: true,
          day14_notified_at: new Date().toISOString(),
          conexa_day14_read: paragraph,
          conexa_day14_at: new Date().toISOString(),
        })
        .eq("id", u.id);
      await admin.from("milestone_events").insert({
        user_id: u.id,
        milestone: "day14",
        execution_count_at: ex,
      });
      // Unified email helper also handles the database notification automatically!
      await sendDay14Email(u.email, firstName, ex, paragraph);
      await logEvent("milestone_day14_notified", { execution_count: ex, execution_rate: rate }, u.id, "cron");
    }
    if (ex >= 21 && !u.day21_reached) {
      await admin
        .from("users")
        .update({ day21_reached: true, day21_reached_at: new Date().toISOString() })
        .eq("id", u.id);
      await admin.from("milestone_events").insert({
        user_id: u.id,
        milestone: "day21",
        execution_count_at: ex,
      });
      // Unified email helper also handles the database notification automatically!
      await sendDay21Email(u.email, firstName, u.referral_code || "");
      await logEvent(
        "milestone_day21_reached",
        { execution_count: ex, break_count: u.break_count ?? 0 },
        u.id,
        "cron",
      );
    }
    if (ex >= 45 && !u.day45_reached) {
      await admin
        .from("users")
        .update({ day45_reached: true, day45_reached_at: new Date().toISOString() })
        .eq("id", u.id);
      await admin.from("milestone_events").insert({
        user_id: u.id,
        milestone: "day45",
        execution_count_at: ex,
      });
      // Unified email helper also handles the database notification automatically!
      await sendDay45Email(u.email, firstName);
      await logEvent("milestone_day45_reached", { execution_count: ex }, u.id, "cron");
    }
  }

  // ─── Window-Closing Reminder (20:00 UTC) ──────────────────────────────────
  if (utcH === 20 && utcM === 0) {
    const ok = await acquireLock("window_closing_reminder", dateKey);
    if (ok) {
      const { data: reminderUsers } = await admin
        .from("users")
        .select("id, email, full_name, first_name, execution_count, last_submission_date")
        .or(`last_submission_date.lt.${today},last_submission_date.is.null`);

      for (const u of reminderUsers ?? []) {
        const firstName = String(u.first_name || u.full_name || "Founder").split(" ")[0];
        
        // Unified email helper handles both sending and notification database insert!
        await sendWindowClosingReminderEmail(u.email, firstName, u.execution_count ?? 0);
        await logEvent("window_closing_reminder_sent", { execution_count: u.execution_count ?? 0 }, u.id, "cron");
      }
    }
  }

  // ─── Recurring Referral & Milestones Sequences (12:00 UTC) ─────────────────
  if (utcH === 12 && utcM === 0) {
    const ok = await acquireLock("referral_milestones", dateKey);
    if (ok) {
      const { data: allUsers } = await admin.from("users").select("*");
      for (const u of allUsers ?? []) {
        const days = u.days_on_record ?? 0;
        
        // Fetch all referrals made by this user
        const { data: refs } = await admin
          .from("referrals")
          .select("onboarding_completed, subscription_valid, created_at")
          .eq("referrer_user_id", u.id);

        const onboardedCount = (refs ?? []).filter(r => r.onboarding_completed).length;
        const paidCount = (refs ?? []).filter(r => r.subscription_valid).length;
        const hasReferrals = (refs ?? []).length > 0;

        const firstName = String(u.first_name || u.full_name || "Founder").split(" ")[0];

        if (!hasReferrals) {
          // --- ZERO REFERRERS SEQUENCE ---
          if (days === 7) {
            await sendZeroReferrerDay7Email(u.email, firstName, u.referral_code || "");
            await logEvent("zero_referrer_day7_sent", { days }, u.id, "cron");
          } else if (days === 14) {
            await sendZeroReferrerDay14Email(u.email, firstName, u.referral_code || "");
            await logEvent("zero_referrer_day14_sent", { days }, u.id, "cron");
          } else if (days === 21) {
            await sendZeroReferrerDay21Email(u.email, firstName, u.referral_code || "");
            await logEvent("zero_referrer_day21_sent", { days }, u.id, "cron");
          } else if (days === 28) {
            await sendZeroReferrerDay28Email(u.email, firstName, u.referral_code || "");
            await logEvent("zero_referrer_day28_sent", { days }, u.id, "cron");
          } else if (days === 35) {
            await sendZeroReferrerDay35Email(u.email, firstName, u.referral_code || "");
            await logEvent("zero_referrer_day35_sent", { days }, u.id, "cron");
          }
        } else {
          // --- ACTIVE REFERRERS SEQUENCE ---
          const { data: rewards } = await admin
            .from("referral_rewards")
            .select("tier_reached")
            .eq("user_id", u.id);
          const rewardTiers = new Set((rewards ?? []).map(r => r.tier_reached));

          const has3Paid = rewardTiers.has("3_paid");
          const has5Paid = rewardTiers.has("5_paid");
          const has5Onboarded = rewardTiers.has("5_onboarded");

          const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
          const allConversionWindowsClosed = (refs ?? []).every(ref => new Date(ref.created_at) < thirtyDaysAgo);

          const paidCondition = (has3Paid && has5Paid) || allConversionWindowsClosed;
          const onboardingCondition = has5Onboarded;

          const stopConditionMet = paidCondition && onboardingCondition;

          if (!stopConditionMet) {
            if (days === 7) {
              await sendActiveReferrerRecurringEmail(u.email, firstName, u.referral_code || "", 7, onboardedCount, paidCount, "Next milestone: 3 onboarded = 50% off.");
              await logEvent("active_referrer_day7_sent", { days }, u.id, "cron");
            } else if (days === 14) {
              await sendActiveReferrerRecurringEmail(u.email, firstName, u.referral_code || "", 14, onboardedCount, paidCount, "Next milestone: 5 onboarded = 1 month free.");
              await logEvent("active_referrer_day14_sent", { days }, u.id, "cron");
            } else if (days === 21) {
              let discountDesc = "25% off";
              if (onboardedCount >= 5) discountDesc = "1 month free";
              else if (onboardedCount >= 3) discountDesc = "50% off";
              await sendActiveReferrerRecurringEmail(u.email, firstName, u.referral_code || "", 21, onboardedCount, paidCount, `Onboarding tiers unlocked! Pay with ${discountDesc} at subscribe.`);
              await logEvent("active_referrer_day21_sent", { days }, u.id, "cron");
            } else if (days === 28) {
              await sendActiveReferrerRecurringEmail(u.email, firstName, u.referral_code || "", 28, onboardedCount, paidCount, "Conversion window closes soon. Refer paid subscribers for free months.");
              await admin.from("users").update({ day28_referral_sent: true }).eq("id", u.id);
              await logEvent("active_referrer_day28_sent", { days }, u.id, "cron");
            } else if (days >= 35 && days % 7 === 0 && u.day28_referral_sent) {
              let nextTierDesc = "";
              if (onboardedCount < 1) nextTierDesc = "Next milestone: 1 onboarded = 25% off.";
              else if (onboardedCount < 3) nextTierDesc = "Next milestone: 3 onboarded = 50% off.";
              else if (onboardedCount < 5) nextTierDesc = "Next milestone: 5 onboarded = 1 month free.";
              else if (paidCount < 3) nextTierDesc = "Next milestone: 3 paid referrals = 3 months free.";
              else if (paidCount < 5) nextTierDesc = "Next milestone: 5 paid referrals = 50% off for 3 months.";
              else nextTierDesc = "All reward tiers reached! Thank you for sharing Oxecute.";

              await sendActiveReferrerRecurringEmail(u.email, firstName, u.referral_code || "", days, onboardedCount, paidCount, nextTierDesc);
              await logEvent(`active_referrer_recurring_sent`, { days }, u.id, "cron");
            }
          }
        }
      }
    }
  }

  await admin
    .from("users")
    .update({ username_locked_at: new Date().toISOString() })
    .is("username_locked_at", null)
    .lte(
      "created_at",
      new Date(Date.now() - 7 * 86400000).toISOString(),
    );

  return { ok: true };
}
