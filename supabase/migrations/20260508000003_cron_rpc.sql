create or replace function public.increment_all_days_on_record()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set days_on_record = days_on_record + 1
  where (created_at::date) <= (timezone('utc', now()))::date;
end;
$$;

grant execute on function public.increment_all_days_on_record() to service_role;
