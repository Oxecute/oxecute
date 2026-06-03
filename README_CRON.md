# Cron & Email Scheduler System

Oxecute utilizes a scheduled heartbeat cron to process day increments, write automated gap/break marks, track milestone progressions, and send contextual transactional email sequences.

---

## Code Map & Endpoints

*   **[src/lib/cron/heartbeat.ts](file:///d:/oxe-cute/src/lib/cron/heartbeat.ts)**: Contains the central scheduler logic (`runCronHeartbeat`) and the lock acquisition utility.
*   **[src/app/api/cron/heartbeat/route.ts](file:///d:/oxe-cute/src/app/api/cron/heartbeat/route.ts)**: API endpoint exposed to Vercel Cron. Protects access using a bearer token and supports time-travel simulation parameters.
*   **[src/lib/email/service.ts](file:///d:/oxe-cute/src/lib/email/service.ts)**: Defines high-level email dispatch functions integrating database notifications and Resend mail deliveries.

---

## 1. Cron Job Schedule

The cron is designed to trigger periodically (e.g. every 10–15 minutes). When called, it checks the current UTC hour and minute to fire specific time-locked routines:

### A. 00:00 UTC — Day Increments (`days_increment` lock)
*   **Action**: Calls the Supabase RPC function `increment_all_days_on_record`.
*   **Effect**: Increments the `days_on_record` integer field for all active users in the database, representing the progression of their record age.

### B. 12:00 UTC — Referral Sequences (`referral_milestones` lock)
Runs the email marketing sequence based on user account age (`days_on_record`) and their current referral counts:
*   **Zero-Referrals Sequence**: If the founder has referred no other users, sends specific templates on Days 7, 14, 21, 28, and 35.
*   **Active-Referrers Sequence**: If the user has referrals, sends recurring progress templates on Days 7, 14, 21, and 28. It continues sending weekly templates from Day 35 onwards until the user unlocks all reward tiers (3 paid, 5 paid, and 5 onboarded) or their 30-day conversion windows expire.

### C. 20:00 UTC — Window Closing Reminders (`window_closing_reminder` lock)
*   **Action**: Checks for active users who have not submitted an entry today (UTC) and do not have `last_submission_date === today`.
*   **Effect**: Sends a transactional reminder email warning them that their execution window closes at 23:59:59 UTC.

### D. 23:59 UTC — Automated Gap Detection (`break_marks` lock)
*   **Action**: Scans all users whose accounts were created before today. If a user did not submit an entry today and did not log a voluntary rest day:
    1.  Inserts a row into the `break_marks` table containing `day_number` and their current execution count.
    2.  Increments the user's `break_count` by `1`.
    3.  Writes a system notification: *"Break mark written - Day N. No submission on [date]. This gap is part of your record."*
    4.  Logs a custom `break_mark_written` analytics event.

---

## 2. Milestone Progressions (Evaluated on every Heartbeat)

During every run, the heartbeat checks all users for target execution milestone unlocks:
*   **Day 7 Milestone**: Triggered when a user reaches `execution_count >= 7` and `day7_reached = false`. Sets the flag to `true`, writes a milestone event, and emails a congratulatory update.
*   **Day 14 Milestone**: Triggered when a user reaches `execution_count >= 14` and `day14_notified = false`.
    1.  Compiles the user's initial onboarding baseline and last 5 ledger entries.
    2.  Invokes Claude (`conexaDay14Read`) to generate a concise, 4-sentence mid-point review outlining record status, widening gaps, and instructions for the next 7 days.
    3.  Stores the review text in `conexa_day14_read` and sends the Day 14 milestone email.
*   **Day 21 Milestone**: Triggered when a user reaches `execution_count >= 21` and `day21_reached = false`. Flags Day 21 as reached, locking their chosen `username` permanently if their account age is >= 7 days.
*   **Day 45 Milestone**: Triggered when a user reaches `execution_count >= 45` and `day45_reached = false`. Unlocks the peer directory tab.

---

## 3. The Lock Mechanism (`cron_locks`)

To prevent duplicate runs (e.g. if the cron endpoint is triggered multiple times within the same minute), jobs are guarded by the `cron_locks` table.
*   `acquireLock(jobName, dateKey)` inserts or upserts a row for that job in the database.
*   If `last_run_date` matches the current UTC date string (`YYYY-MM-DD`), the lock acquisition fails (`return false`), and the job is safely bypassed.

---

## 4. How to Test Locally

You can test cron behavior locally without waiting for scheduled triggers:

1.  Make sure your `.env.local` contains `CRON_SECRET=your-secret`.
2.  Send a request to `/api/cron/heartbeat` with the authorization header:
    ```bash
    curl -X GET "http://localhost:3000/api/cron/heartbeat" \
      -H "Authorization: Bearer your-secret"
    ```
3.  **Simulating UTC Times**: You can append the `simulated_time` query parameter to force the scheduler to evaluate jobs as if it were a specific hour/date. For example:
    *   Test Day 1 Increment (at midnight UTC):
        `?simulated_time=2026-06-03T00:00:00Z`
    *   Test 20:00 UTC Reminders:
        `?simulated_time=2026-06-03T20:00:00Z`
    *   Test 23:59 UTC Gap Detection & Break Writing:
        `?simulated_time=2026-06-03T23:59:00Z`
