-- Hotfix production : fermer l'acces public aux tables de depot.
-- A executer dans Supabase SQL Editor (projet gp-finances-depot).

BEGIN;

ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.session_reminders ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.sessions FROM anon;
REVOKE ALL ON TABLE public.sessions FROM authenticated;
REVOKE ALL ON TABLE public.session_reminders FROM anon;
REVOKE ALL ON TABLE public.session_reminders FROM authenticated;

DROP POLICY IF EXISTS sessions_service_role_all ON public.sessions;
CREATE POLICY sessions_service_role_all ON public.sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS session_reminders_service_role_all ON public.session_reminders;
CREATE POLICY session_reminders_service_role_all ON public.session_reminders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
