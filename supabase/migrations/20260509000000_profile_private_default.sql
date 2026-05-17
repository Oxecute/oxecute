-- New accounts: profile is private until the founder opts in.
alter table public.users alter column profile_public set default false;
