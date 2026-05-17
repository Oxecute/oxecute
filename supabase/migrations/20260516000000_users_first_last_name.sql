-- Landing/onboarding: store first + last name alongside full_name (display / sort).

alter table public.users add column if not exists first_name text;
alter table public.users add column if not exists last_name text;

comment on column public.users.first_name is 'Given name(s); optional if legacy rows only have full_name';
comment on column public.users.last_name is 'Family / additional name parts; optional';

-- Best-effort backfill from full_name (first token + remainder).
update public.users
set
  first_name = nullif(trim(split_part(trim(full_name), ' ', 1)), ''),
  last_name = nullif(
    trim(
      substring(
        trim(full_name) from (length(trim(split_part(trim(full_name), ' ', 1))) + 2)
      )
    ),
    ''
  )
where coalesce(trim(first_name), '') = ''
  and coalesce(trim(last_name), '') = ''
  and coalesce(trim(full_name), '') <> '';
