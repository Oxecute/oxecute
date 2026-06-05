-- Migration: Add support for Directives, Integration Events, Evaluation Audits, and Google Calendar tokens.

-- 1. Modify users table to support Google Calendar oauth connection
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS google_calendar_connected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS google_calendar_tokens jsonb;

-- 2. Create directives table
CREATE TABLE IF NOT EXISTS public.directives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_number int NOT NULL,
  directive_text text NOT NULL,
  behavioral_tag text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'missed')),
  proof_url text,
  is_maintenance boolean NOT NULL DEFAULT false,
  prompt_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

-- 3. Create integration_events table
CREATE TABLE IF NOT EXISTS public.integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source text NOT NULL,
  event_type text NOT NULL,
  external_id text,
  payload jsonb NOT NULL,
  weight numeric NOT NULL DEFAULT 0.0,
  is_eligible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index to prevent duplicate external integration events
CREATE UNIQUE INDEX IF NOT EXISTS integration_events_unique_idx 
ON public.integration_events (user_id, source, external_id) 
WHERE external_id IS NOT NULL;

-- 4. Create execution_evaluation_audit table
CREATE TABLE IF NOT EXISTS public.execution_evaluation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  evaluation_date date NOT NULL,
  winning_source text NOT NULL,
  audit_details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, evaluation_date)
);

-- 5. RLS Rules & Permissions
ALTER TABLE public.directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_evaluation_audit ENABLE ROW LEVEL SECURITY;

-- Grant select/update to authenticated users, full access to service_role
GRANT SELECT, UPDATE ON public.directives TO authenticated;
GRANT SELECT ON public.integration_events TO authenticated;
GRANT SELECT ON public.execution_evaluation_audit TO authenticated;

GRANT ALL ON public.directives TO service_role;
GRANT ALL ON public.integration_events TO service_role;
GRANT ALL ON public.execution_evaluation_audit TO service_role;

-- RLS Select policies
CREATE POLICY "directives_select_own" ON public.directives FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "integration_events_select_own" ON public.integration_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "execution_evaluation_audit_select_own" ON public.execution_evaluation_audit FOR SELECT USING (auth.uid() = user_id);

-- RLS Update policies (for directive proof submission)
CREATE POLICY "directives_update_own" ON public.directives FOR UPDATE USING (auth.uid() = user_id);

-- 6. Create signal_score_history table
CREATE TABLE IF NOT EXISTS public.signal_score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score_date date NOT NULL,
  raw_score numeric NOT NULL,
  smoothed_score numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, score_date)
);

ALTER TABLE public.signal_score_history ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.signal_score_history TO authenticated;
GRANT ALL ON public.signal_score_history TO service_role;
CREATE POLICY "signal_score_history_select_own" ON public.signal_score_history FOR SELECT USING (auth.uid() = user_id);
