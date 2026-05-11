-- Oxecute MVP — 14 tables, RLS, append-only revoke
-- Run in Supabase SQL editor or via CLI

create extension if not exists "pgcrypto";

-- ─── users ───────────────────────────────────────────────────────────
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  username text unique not null,
  username_locked_at timestamptz,
  full_name text not null,
  country text not null,
  startup_name text not null,
  found_us text not null,
  stage text not null,
  mrr text not null,
  startup_description text not null,
  cal_q1_shipped text,
  cal_q2_customers text,
  cal_q3_didnt_work text,
  cal_q4_traction text,
  cal_q5_unknown text,
  calibration_locked boolean default false,
  blocker_text text,
  avoidance_tags text[],
  conexa_day1_report jsonb,
  conexa_day1_at timestamptz,
  conexa_day14_read text,
  conexa_day14_at timestamptz,
  execution_count int default 0,
  break_count int default 0,
  days_on_record int default 0,
  last_submission_date date,
  founding_member boolean default false,
  day7_reached boolean default false,
  day7_reached_at timestamptz,
  day14_notified boolean default false,
  day14_notified_at timestamptz,
  day21_reached boolean default false,
  day21_reached_at timestamptz,
  day21_unlocked boolean default false,
  day45_reached boolean default false,
  day45_reached_at timestamptz,
  day28_referral_sent boolean default false,
  tier text default 'record',
  subscribed boolean default false,
  subscribed_at timestamptz,
  subscription_price numeric,
  subscription_currency text,
  profile_public boolean default true,
  profile_bio text,
  show_breaks boolean default true,
  show_signal_score boolean default false,
  referral_code text unique not null,
  referred_by uuid references public.users (id),
  created_at timestamptz default now()
);

create index users_username_idx on public.users (username);
create index users_referral_code_idx on public.users (referral_code);

-- ─── entries (append-only) ─────────────────────────────────────────────
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  entry_number int not null,
  day_number int not null,
  category text not null,
  source_type text not null,
  tier text not null,
  url text,
  declaration_text text,
  upload_paths text[],
  context_sentence text,
  validation_hash text not null,
  url_resolved_status int,
  url_content_type text,
  upgraded_from_id uuid references public.entries (id),
  execution_day boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, entry_number),
  unique (user_id, day_number)
);

create index entries_user_id_idx on public.entries (user_id);

-- ─── break_marks (append-only) ─────────────────────────────────────────
create table public.break_marks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  break_date date not null,
  day_number int not null,
  execution_count_before int not null,
  written_at timestamptz not null default now(),
  unique (user_id, break_date)
);

-- ─── milestone_events ──────────────────────────────────────────────────
create table public.milestone_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  milestone text not null,
  fired_at timestamptz not null default now(),
  execution_count_at int not null,
  notified_inbox boolean default false,
  notified_email boolean default false
);

-- ─── conexa_messages ───────────────────────────────────────────────────
create table public.conexa_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null,
  content text not null,
  scope text not null default 'full_record',
  flagged_speculation boolean default false,
  prompt_version text,
  tokens_in int,
  tokens_out int,
  latency_ms int,
  created_at timestamptz default now()
);

create index conexa_messages_user_id_idx on public.conexa_messages (user_id);

-- ─── notifications ─────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  icon_name text,
  title text not null,
  body text,
  action_url text,
  read boolean default false,
  created_at timestamptz default now()
);

create index notifications_user_id_idx on public.notifications (user_id);

-- ─── events (service role insert only) ─────────────────────────────────
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  session_id text not null,
  event_type text not null,
  properties jsonb default '{}',
  created_at timestamptz default now()
);

create index events_event_type_idx on public.events (event_type);

-- ─── url_validations ───────────────────────────────────────────────────
create table public.url_validations (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references public.entries (id) on delete set null,
  url text not null,
  http_status int,
  content_type text,
  body_size_bytes int,
  passed boolean not null,
  failure_reason text,
  validated_at timestamptz default now()
);

-- ─── referrals ─────────────────────────────────────────────────────────
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users (id) on delete cascade,
  referred_user_id uuid not null references public.users (id) on delete cascade,
  referral_code text not null,
  signup_completed boolean default false,
  onboarding_completed boolean default false,
  subscription_created boolean default false,
  subscription_created_at timestamptz,
  subscription_valid boolean default false,
  discount_applied boolean default false,
  flagged_for_review boolean default false,
  created_at timestamptz default now(),
  unique (referrer_user_id, referred_user_id)
);

-- ─── referral_rewards ──────────────────────────────────────────────────
create table public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  tier_reached text not null,
  reward_type text not null,
  reward_value numeric not null,
  locked_at timestamptz not null default now(),
  claimed boolean default false,
  claimed_at timestamptz,
  applied_to_cycle text
);

-- ─── feature_requests ───────────────────────────────────────────────────
create table public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  submitter_user_id uuid references public.users (id) on delete set null,
  title text not null,
  description text not null,
  category text not null,
  status text default 'pending',
  upvote_count int default 0,
  comment_count int default 0,
  created_at timestamptz default now()
);

-- ─── feature_request_upvotes ───────────────────────────────────────────
create table public.feature_request_upvotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.feature_requests (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  user_execution_count int not null,
  created_at timestamptz default now(),
  unique (request_id, user_id)
);

-- ─── waitlist_signups ───────────────────────────────────────────────────
create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  feature_slug text not null,
  source_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz default now()
);

-- ─── backfill_requests ─────────────────────────────────────────────────
create table public.backfill_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  requested_date date not null,
  url text not null,
  category text not null,
  status text default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- ─── Append-only: ledger only writable via service_role (API routes) ───
revoke all on public.entries from public;
revoke all on public.break_marks from public;
grant select on public.entries to authenticated;
grant select on public.break_marks to authenticated;
grant all on public.entries to service_role;
grant all on public.break_marks to service_role;

revoke update, delete on public.entries from authenticated, anon;
revoke insert, update, delete on public.entries from authenticated, anon;
revoke insert, update, delete on public.break_marks from authenticated, anon;

-- ─── RLS ───────────────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.entries enable row level security;
alter table public.break_marks enable row level security;
alter table public.milestone_events enable row level security;
alter table public.conexa_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.events enable row level security;
alter table public.url_validations enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.feature_requests enable row level security;
alter table public.feature_request_upvotes enable row level security;
alter table public.waitlist_signups enable row level security;
alter table public.backfill_requests enable row level security;

-- users: own row full access for select/update; insert own id
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- entries (INSERT only via service_role API)
create policy "entries_select_own" on public.entries for select using (auth.uid() = user_id);

-- break_marks (INSERT only via cron API)
create policy "break_marks_select_own" on public.break_marks for select using (auth.uid() = user_id);

-- milestone_events (INSERT via service_role)
create policy "milestone_select_own" on public.milestone_events for select using (auth.uid() = user_id);

-- conexa_messages
create policy "conexa_select_own" on public.conexa_messages for select using (auth.uid() = user_id);
create policy "conexa_insert_own" on public.conexa_messages for insert with check (auth.uid() = user_id);

-- notifications (INSERT via service_role)
create policy "notif_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notif_update_own" on public.notifications for update using (auth.uid() = user_id);

-- referrals
create policy "referrals_select_as_parties"
  on public.referrals for select
  using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

-- referral_rewards (INSERT via service_role)
create policy "referral_rewards_select_own" on public.referral_rewards for select using (auth.uid() = user_id);

-- feature_requests (submit via service_role API)
create policy "feature_requests_select_all" on public.feature_requests for select to authenticated using (true);

-- feature_request_upvotes
create policy "upvotes_select" on public.feature_request_upvotes for select to authenticated using (true);
create policy "upvotes_insert_own" on public.feature_request_upvotes for insert to authenticated with check (auth.uid() = user_id);
create policy "upvotes_delete_own" on public.feature_request_upvotes for delete to authenticated using (auth.uid() = user_id);

-- waitlist_signups
create policy "waitlist_insert_authed" on public.waitlist_signups for insert to authenticated with check (true);

-- backfill_requests
create policy "backfill_select_own" on public.backfill_requests for select using (auth.uid() = user_id);

comment on table public.entries is 'Append-only: INSERT via service_role only';
comment on table public.break_marks is 'Append-only: INSERT via service_role only';
