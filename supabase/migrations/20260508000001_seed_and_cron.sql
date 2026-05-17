create table if not exists public.cron_locks (
  job text primary key,
  last_run_date date not null
);

alter table public.cron_locks enable row level security;

insert into public.feature_requests (
  submitter_user_id, title, description, category, status, upvote_count, comment_count
)
select null, 'Backfill Execution Record',
  'Allow founders to submit verified proof for days before they signed up — with a hard cap of 21 days credited toward milestone unlocks. Days beyond 21 are visible on the record but don''t count toward tier thresholds.',
  'feature', 'reviewing', 0, 0
where not exists (select 1 from public.feature_requests where title = 'Backfill Execution Record');

insert into public.feature_requests (
  submitter_user_id, title, description, category, status, upvote_count, comment_count
)
select null, 'Conexa Context Refresh',
  'Allow founders to trigger a fresh Conexa read after a major pivot or stage change, without resetting the record. New context sits alongside the original Day 1 baseline permanently.',
  'feature', 'reviewing', 0, 0
where not exists (select 1 from public.feature_requests where title = 'Conexa Context Refresh');

insert into public.feature_requests (
  submitter_user_id, title, description, category, status, upvote_count, comment_count
)
select null, 'Weekly Execution Summary Email',
  'A Sunday evening field report — days executed that week, breaks, category breakdown, one Conexa observation. Plain text preferred. Opt-in.',
  'feature', 'planned', 0, 0
where not exists (select 1 from public.feature_requests where title = 'Weekly Execution Summary Email');
