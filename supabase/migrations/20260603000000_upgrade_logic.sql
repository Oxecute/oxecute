-- Migration: Support declaration-to-verified-proof upgrade logic by relaxing unique day_number constraint
-- Drop existing user_id, day_number constraint
ALTER TABLE public.entries DROP CONSTRAINT IF EXISTS entries_user_id_day_number_key;

-- Create unique index to allow only one root (non-upgraded) entry per day per user
CREATE UNIQUE INDEX IF NOT EXISTS entries_user_id_day_number_idx ON public.entries (user_id, day_number) WHERE upgraded_from_id IS NULL;

-- Create unique index on upgraded_from_id to enforce one-off upgrade logic (an entry can only be upgraded once)
CREATE UNIQUE INDEX IF NOT EXISTS entries_upgraded_from_id_idx ON public.entries (upgraded_from_id) WHERE upgraded_from_id IS NOT NULL;
