-- COLLER CE SQL dans Supabase > SQL Editor > New query

CREATE TABLE IF NOT EXISTS sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token             TEXT NOT NULL UNIQUE,
  monday_item_id    TEXT NOT NULL,
  client_name       TEXT NOT NULL,
  client_email      TEXT NOT NULL,
  bank              TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'transferred')),
  offre_url         TEXT,
  tableau_url       TEXT,
  identite_url      TEXT,
  token_expires_at  TIMESTAMPTZ NOT NULL,
  uploaded_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);
CREATE INDEX IF NOT EXISTS idx_sessions_monday ON sessions (monday_item_id);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE sessions FROM anon;
REVOKE ALL ON TABLE sessions FROM authenticated;

DROP POLICY IF EXISTS sessions_service_role_all ON sessions;
CREATE POLICY sessions_service_role_all ON sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS session_reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  monday_item_id  TEXT NOT NULL,
  day_offset      SMALLINT NOT NULL CHECK (day_offset IN (2, 5, 8, 12, 16, 20, 25, 30)),
  due_at          TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  attempt_count   INTEGER NOT NULL DEFAULT 0,
  sent_at         TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  smtp_message_id TEXT,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_session_reminders_session_day ON session_reminders (session_id, day_offset);
CREATE INDEX IF NOT EXISTS idx_session_reminders_due ON session_reminders (status, due_at);
CREATE INDEX IF NOT EXISTS idx_session_reminders_monday ON session_reminders (monday_item_id);
ALTER TABLE session_reminders ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE session_reminders FROM anon;
REVOKE ALL ON TABLE session_reminders FROM authenticated;

DROP POLICY IF EXISTS session_reminders_service_role_all ON session_reminders;
CREATE POLICY session_reminders_service_role_all ON session_reminders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
