-- Migration: Add GitHub Repo and Branch columns to the users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS github_repo TEXT,
ADD COLUMN IF NOT EXISTS github_branch TEXT DEFAULT 'main';
