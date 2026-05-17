alter table public.users
  add column if not exists calibration_synthesis jsonb;
