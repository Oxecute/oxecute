import { conexaDay14Read } from "@/lib/conexa/anthropic";
import { executionDayNumber, executionRate, startOfUtcDay, utcTodayISO } from "@/lib/dates";
import { sendEmail } from "@/lib/email/send";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { logEvent } from "@/lib/analytics";

async function acquireLock(job: string, dateKey: string): Promise<boolean> {
  const admin = createServiceRoleClient();
  const { data } = await admin.from("cron_locks").select("last_run_date").eq("job", job).maybeSingle();
  if (data?.last_run_date === dateKey) return false;
  await admin.from("cron_locks").upsert({ job, last_run_date: dateKey }, { onConflict: "job" });
  return true;
}

export async function runCronHeartbeat() {
  const admin = createServiceRoleClient();
  const now = new Date();
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
      await admin.from("notifications").insert({
        user_id: u.id,
        type: "milestone",
        title: "7 days executed",
        body: "You can now upvote and comment on feature requests. Your referral link is active.",
      });
      await sendEmail({
        to: u.email,
        subject: "7 days executed",
        text: `7 days milestone email - ${u.full_name}`,
        html: `<p>7 days executed</p>`,
      });
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
      await admin.from("notifications").insert({
        user_id: u.id,
        type: "milestone",
        title: "14 days executed - Conexa mid-point read",
        body: paragraph,
      });
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
      await admin.from("notifications").insert({
        user_id: u.id,
        type: "milestone",
        title: "21 days executed - you've earned this",
        body: "Signal Score, Daily Directive, and Builder tier just unlocked.",
      });
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
      await admin.from("notifications").insert({
        user_id: u.id,
        type: "milestone",
        title: "45 days executed - community opens",
        body: "Founders at your stage who've also executed 45 days are now visible to you.",
      });
      await logEvent("milestone_day45_reached", { execution_count: ex }, u.id, "cron");
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
