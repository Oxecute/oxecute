import { callAnthropic, conexaDay14Read } from "@/lib/conexa/anthropic";
import { executionDayNumber, executionRate, startOfUtcDay, utcTodayISO } from "@/lib/dates";
import { sha256Hex } from "@/lib/crypto";
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
  if (utcH === 0 && utcM === 1) {
    const ok = await acquireLock("directive_generation_and_signal", dateKey);
    if (ok) {
      // 1. Calculate platform miss rate for yesterday's directives (to support maintenance mode)
      const yesterdayStart = new Date(now.getTime() - 26 * 3600 * 1000);
      const yesterdayEnd = new Date(now.getTime() - 1 * 60 * 1000);
      const { data: yesterdayDirectives } = await admin
        .from("directives")
        .select("status")
        .gte("created_at", yesterdayStart.toISOString())
        .lte("created_at", yesterdayEnd.toISOString());

      let platformMaintenance = false;
      if (yesterdayDirectives && yesterdayDirectives.length > 0) {
        const totalYesterday = yesterdayDirectives.length;
        const missedYesterday = yesterdayDirectives.filter((d) => d.status === "missed").length;
        const platformMissRate = missedYesterday / totalYesterday;
        if (platformMissRate > 0.25) {
          platformMaintenance = true;
        }
      }

      // Check last 3 days for platform miss rate > 25% (stateless maintenance window)
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 3600 * 1000);
      const { data: recentDirectives } = await admin
        .from("directives")
        .select("created_at, status")
        .gte("created_at", threeDaysAgo.toISOString());

      if (recentDirectives && recentDirectives.length > 0) {
        const groups: Record<string, { total: number; missed: number }> = {};
        for (const d of recentDirectives) {
          const dayKey = new Date(d.created_at).toISOString().split("T")[0];
          if (!groups[dayKey]) groups[dayKey] = { total: 0, missed: 0 };
          groups[dayKey].total++;
          if (d.status === "missed") groups[dayKey].missed++;
        }
        for (const key of Object.keys(groups)) {
          const rate = groups[key].missed / groups[key].total;
          if (rate > 0.25) {
            platformMaintenance = true;
            break;
          }
        }
      }

      // Fetch all users
      const { data: users } = await admin.from("users").select("*");
      for (const u of users ?? []) {
        // --- A. Compute nightly Signal Score ---
        try {
          const thirtyDaysAgoDate = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString().split("T")[0];
          const { data: recentBreaks } = await admin
            .from("break_marks")
            .select("id")
            .eq("user_id", u.id)
            .gte("break_date", thirtyDaysAgoDate);
          
          const { data: dirs } = await admin
            .from("directives")
            .select("status")
            .eq("user_id", u.id);

          const { data: userEntries } = await admin
            .from("entries")
            .select("category")
            .eq("user_id", u.id);

          const breaksInLast30 = recentBreaks?.length ?? 0;
          const directivesIssued = dirs?.length ?? 0;
          const directivesCompleted = dirs?.filter((d) => d.status === "completed").length ?? 0;
          
          const categories = new Set(userEntries?.map((e) => e.category) ?? []);
          const distinctCategories = categories.size;

          const executionCount = u.execution_count ?? 0;
          const daysOnRecord = u.days_on_record ?? 0;
          
          const rawStreak = daysOnRecord > 0 ? (executionCount / daysOnRecord) * 100 : 0;
          const streakDepth = Math.max(0, rawStreak - breaksInLast30 * 4);
          const directiveCompletion = directivesIssued > 0 ? (directivesCompleted / directivesIssued) * 100 : 0;
          const artifactDiversity = (distinctCategories / 3) * 100;

          const rawScore = streakDepth * 0.40 + directiveCompletion * 0.35 + artifactDiversity * 0.25;
          const finalRawScore = Math.min(100, Math.max(0, Math.round(rawScore)));

          // Retrieve past score history to compute 7-day moving average
          const { data: scoreHistory } = await admin
            .from("signal_score_history")
            .select("raw_score")
            .eq("user_id", u.id)
            .order("score_date", { ascending: false })
            .limit(6);

          const prevScores = scoreHistory?.map((s) => Number(s.raw_score)) ?? [];
          const allScores = [finalRawScore, ...prevScores];
          const smoothedScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

          await admin.from("signal_score_history").upsert({
            user_id: u.id,
            score_date: today,
            raw_score: finalRawScore,
            smoothed_score: smoothedScore,
          }, { onConflict: "user_id,score_date" });

        } catch (err) {
          console.error(`[Signal Score calculation] Error for user ${u.id}:`, err);
        }

        // --- B. Generate daily Directive (Day 21+ founders only) ---
        if (u.day21_reached) {
          const { data: userDirectives } = await admin
            .from("directives")
            .select("status")
            .eq("user_id", u.id)
            .order("created_at", { ascending: false })
            .limit(10);

          let consecutiveMisses = 0;
          if (userDirectives) {
            for (const d of userDirectives) {
              if (d.status === "missed") {
                consecutiveMisses++;
              } else if (d.status === "completed") {
                break;
              }
            }
          }

          const individualMaintenance = consecutiveMisses >= 4;
          const isMaintenance = platformMaintenance || individualMaintenance;

          // Call Conexa (Claude) to generate directive
          const systemPrompt = `You are Conexa, the execution intelligence layer of Oxecute.
You generate daily directives for founders based on their execution record and baselines.
Rules:
1. Return a JSON object with exactly two keys: "text" (string, the directive, max 150 characters) and "tag" (one of "product", "distribution", "ops"). Do not wrap in markdown or backticks, or write any other text.
2. The directive MUST be exactly one action sentence with a specific proof requirement. E.g. "Draft your landing page copy in a Google Doc and submit the link." or "Send 5 cold emails to ICP prospects and submit the sent messages link."
3. ${isMaintenance ? 'Maintenance mode is ACTIVE. The directive should be simple, operational, and focused on maintenance (e.g. "Check your server error logs and submit a screenshot link" or "Write a team daily standup note and submit the link").' : `The directive must target the founder's avoidance pattern: ${u.avoidance_tags?.join(", ") || "product"}.`}
4. No cheerleading, no prefix or suffix. Just the direct action.`;

          const userPrompt = `FOUNDER PROFILE:
Startup Name: ${u.startup_name}
Startup Description: ${u.startup_description}
Stage: ${u.stage}
MRR: ${u.mrr}
Avoidance Pattern: ${u.avoidance_tags?.join(", ") || "product"}
Biggest Blocker: ${u.blocker_text || "None"}`;

          let directiveText = isMaintenance 
            ? "Check database connection latency and document findings in a document."
            : "Reach out to 5 prospective customers via LinkedIn and submit proof of sent messages.";
          let behavioralTag = isMaintenance ? "ops" : (u.avoidance_tags?.[0] || "product");

          try {
            const response = await callAnthropic({
              system: systemPrompt,
              messages: [{ role: "user", content: userPrompt }],
              max_tokens: 300,
            });

            const cleanJsonStr = response.text
              .replace(/```json/i, "")
              .replace(/```/g, "")
              .trim();

            const parsed = JSON.parse(cleanJsonStr);
            if (parsed.text) directiveText = parsed.text;
            if (parsed.tag && ["product", "distribution", "ops"].includes(parsed.tag)) {
              behavioralTag = parsed.tag;
            }
          } catch (err) {
            console.error(`[Directive Generation] Failed to generate AI directive for user ${u.id}:`, err);
          }

          const dayNum = executionDayNumber(u.created_at as string, now);

          await admin.from("directives").insert({
            user_id: u.id,
            day_number: dayNum,
            directive_text: directiveText,
            behavioral_tag: behavioralTag,
            status: "open",
            is_maintenance: isMaintenance,
            prompt_version: "v1.0",
          });

          await admin.from("notifications").insert({
            user_id: u.id,
            type: "system",
            title: "New Conexa directive generated",
            body: `Day ${dayNum} Directive is open: "${directiveText}"`,
            action_url: "/directive",
          });
        }
      }
    }
  }
  if (utcH === 23 && utcM === 59) {
    const ok = await acquireLock("nightly_evaluation", dateKey);
    if (ok) {
      const { data: users } = await admin.from("users").select("*");
      for (const u of users ?? []) {
        if (!u.created_at) continue;
        const created = new Date(u.created_at);
        if (startOfUtcDay(created).getTime() > startOfUtcDay(now).getTime()) continue;
        const dayNum = executionDayNumber(u.created_at as string, now);

        // 1. Check if user already has an entry for today (manual/immediate submission)
        const { data: existingEntry } = await admin
          .from("entries")
          .select("id")
          .eq("user_id", u.id)
          .eq("day_number", dayNum)
          .maybeSingle();

        interface IntegrationEventRecord {
          id: string;
          source: string;
          payload: Record<string, unknown> | null;
          url?: string;
        }

        let executionRecorded = !!existingEntry;
        let winningSource = existingEntry ? "manual" : null;
        let winningEvent: IntegrationEventRecord | null = null;

        if (!executionRecorded) {
          // 2. Fetch eligible integration events created today
          const startOfDay = new Date(now);
          startOfDay.setUTCHours(0, 0, 0, 0);

          const { data: events } = await admin
            .from("integration_events")
            .select("*")
            .eq("user_id", u.id)
            .eq("is_eligible", true)
            .gte("created_at", startOfDay.toISOString());

          if (events && events.length > 0) {
            // Priority: github -> stripe -> calendly
            const githubEvent = events.find((e) => e.source === "github");
            const stripeEvent = events.find((e) => e.source === "stripe");
            const calendlyEvent = events.find((e) => e.source === "calendly");

            const foundEvent = githubEvent || stripeEvent || calendlyEvent;
            if (foundEvent) {
              winningEvent = {
                id: foundEvent.id,
                source: foundEvent.source,
                payload: foundEvent.payload as Record<string, unknown> | null,
              };
              winningSource = winningEvent.source;
              executionRecorded = true;
            }
          }
        }

        if (executionRecorded && winningSource !== "manual" && winningEvent) {
          // Auto-record in entries table
          const { data: last } = await admin
            .from("entries")
            .select("entry_number")
            .eq("user_id", u.id)
            .order("entry_number", { ascending: false })
            .limit(1)
            .maybeSingle();

          const nextEntry = (last?.entry_number ?? 0) + 1;
          const payload = (winningEvent.payload || {}) as Record<string, unknown>;
          let url = winningEvent.url || "";
          let category = "product";
          let desc = `Auto-captured via ${winningEvent.source}`;

          if (winningEvent.source === "github") {
            const commits = (payload.commits || []) as Record<string, unknown>[];
            const firstCommit = commits[0];
            const repoObj = (payload.repository || {}) as Record<string, unknown>;
            if (firstCommit) {
              url = (firstCommit.url as string) || `https://github.com/${repoObj.full_name || ""}/commit/${firstCommit.id || ""}`;
              desc = (firstCommit.message as string)?.slice(0, 140) || `GitHub activity`;
            }
            category = "product";
          } else if (winningEvent.source === "stripe") {
            const dataObj = (payload.data || {}) as Record<string, unknown>;
            const obj = (dataObj.object || {}) as Record<string, unknown>;
            url = (obj.receipt_url as string) || `https://stripe.com/payment`;
            category = "ops";
            desc = `Stripe payment verified`;
          } else if (winningEvent.source === "calendly") {
            url = (payload.event as string) || `https://calendly.com`;
            category = "distribution";
            desc = `Calendly meeting completed`;
          }

          const hash = await sha256Hex(url + new Date().toISOString());

          const { error: insertErr } = await admin.from("entries").insert({
            user_id: u.id,
            entry_number: nextEntry,
            day_number: dayNum,
            category,
            source_type: `${winningEvent.source}_auto`,
            tier: "verified_proof",
            url,
            declaration_text: desc,
            validation_hash: hash,
            execution_day: true,
          });

          if (!insertErr) {
            // Update user execution count
            await admin
              .from("users")
              .update({
                execution_count: (u.execution_count ?? 0) + 1,
                last_submission_date: today,
              })
              .eq("id", u.id);

            // Log execution audit
            await admin.from("execution_evaluation_audit").insert({
              user_id: u.id,
              evaluation_date: today,
              winning_source: winningSource,
              audit_details: { event_id: winningEvent.id, payload },
            });

            await admin.from("notifications").insert({
              user_id: u.id,
              type: "system",
              title: `Execution Verified via ${winningSource}`,
              body: `Conexa verified today's work. Entry #${String(nextEntry).padStart(3, "0")} is locked.`,
              action_url: "/dashboard",
            });
          }
        } else if (!executionRecorded) {
          // Write break mark
          const { data: br } = await admin
            .from("break_marks")
            .select("id")
            .eq("user_id", u.id)
            .eq("break_date", today)
            .maybeSingle();

          if (!br) {
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

        // 3. Close open directives as missed
        await admin
          .from("directives")
          .update({
            status: "missed",
            closed_at: new Date().toISOString(),
          })
          .eq("user_id", u.id)
          .eq("status", "open");
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
