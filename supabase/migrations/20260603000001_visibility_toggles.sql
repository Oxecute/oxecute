-- Add three new visibility toggle columns to public.users table
ALTER TABLE public.users
ADD COLUMN show_directives boolean DEFAULT false,
ADD COLUMN show_completion_rate boolean DEFAULT false,
ADD COLUMN show_investor_requests boolean DEFAULT false;
