-- A executer dans Supabase SQL Editor.
-- Cette table evite de recreer un lead PER Tally deja traite si l'item Monday
-- est ensuite supprime ou deplace manuellement.

BEGIN;

CREATE TABLE IF NOT EXISTS public.per_lead_ingestions (
  id                TEXT PRIMARY KEY,
  tally_response_id TEXT,
  email             TEXT,
  phone             TEXT,
  monday_item_id    TEXT,
  monday_board_id   TEXT,
  monday_group_id   TEXT,
  source            TEXT,
  status            TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_per_lead_ingestions_tally_response
  ON public.per_lead_ingestions (tally_response_id)
  WHERE tally_response_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_per_lead_ingestions_email
  ON public.per_lead_ingestions (email)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_per_lead_ingestions_phone
  ON public.per_lead_ingestions (phone)
  WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_per_lead_ingestions_monday_item
  ON public.per_lead_ingestions (monday_item_id)
  WHERE monday_item_id IS NOT NULL;

ALTER TABLE public.per_lead_ingestions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.per_lead_ingestions FROM anon;
REVOKE ALL ON TABLE public.per_lead_ingestions FROM authenticated;

DROP POLICY IF EXISTS per_lead_ingestions_service_role_all ON public.per_lead_ingestions;
CREATE POLICY per_lead_ingestions_service_role_all ON public.per_lead_ingestions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
