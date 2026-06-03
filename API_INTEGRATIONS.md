# Third-Party API Integrations

Oxecute integrates with several cloud platforms and third-party APIs to manage backend persistence, user authentication, transactional emails, and execution intelligence.

---

## 1. Supabase (Backend-as-a-Service)

Supabase provides the core database, authentication, and file storage infrastructure.

### A. Authentication
*   **Sign-In Mechanism**: Supports email/password sign-in and Google OAuth.
*   **Cookie Sync**: Client and server-side authentication are synchronized using cookies. The middleware (`src/middleware.ts`) automatically refreshes expired user sessions and resolves PKCE verification states.

### B. PostgreSQL Database & Storage
*   **Ledger Tables**: Manages persistence for `users`, `entries` (append-only ledger), `break_marks`, `conexa_messages`, `referrals`, `referral_rewards`, `cron_locks`, and `milestone_events`.
*   **Row-Level Security (RLS)**: Enforces privacy rules so users can only access their own submissions, profiles, and storage items.
*   **RPC Procedures**: Houses database functions such as `increment_all_days_on_record` (triggered by cron to increment user record age).
*   **Storage Buckets**: The `entry-uploads` private bucket stores proof attachment files (up to 10MB per file).

---

## 2. Resend (Transactional Email Delivery)

Resend handles all user-facing email notifications.

*   **API Client**: Triggered using the standard Resend Node SDK (`new Resend(apiKey)`).
*   **HTML Templates**: `src/lib/email/templates.ts` structures custom-branded emails for:
    *   Onboarding Welcome (Welcome + baseline Conexa insight)
    *   Milestone Unlocks (Days 7, 14, 21, and 45)
    *   Daily Reminders (UTC 20:00 window closing reminders)
    *   Referral progress (Active referrer and Zero-referrer weekly drip sequences)
*   **Supabase SMTP Integration**: Supabase Auth settings are configured to use Resend's SMTP relay (`smtp.resend.com`) on port 587, ensuring that signup confirmations and password recovery emails are sent from your verified sending domain.

---

## 3. Anthropic (AI Execution Intelligence)

Anthropic's Claude generates analytical insights and answers founder execution questions.

*   **API Endpoint**: Invokes the messages API `/v1/messages` using HTTP POST requests.
*   **Model**: Hardcoded to `claude-sonnet-4-6`.
*   **Functions**:
    1.  **Baseline Activation**: Synthesizes a 6-tab profile checklist during onboarding (`conexaActivation`).
    2.  **Day 14 mid-point review**: Analyzes the first 14 days of submissions and outputs a progress paragraph (`conexaDay14Read`).
    3.  **Interactive chat**: Answers founder queries based on their recent execution context and history (`conexaChat`).

---

## 4. Vercel (Hosting & Schedulers)

Vercel hosts the Next.js frontend and schedules periodic background operations.

*   **Serverless Edge Functions**: API routes under `src/app/api` compile and run as serverless entry points.
*   **Vercel Cron**: Scheduled cron jobs (`vercel.json`) are configured to trigger the heartbeat endpoint `/api/cron/heartbeat` at set UTC times.
*   **Cookie Domains**: Production deployments sync session cookie domains (e.g. `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN=.yourdomain.com`) across custom apex domains and subdomains to prevent PKCE state losses and cookie blocks in iOS Safari/Chrome.
