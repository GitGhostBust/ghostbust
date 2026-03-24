-- Tracks which applications have received a 30-day stale nudge email.
-- One nudge per application, ever (unique constraint on application_id).

CREATE TABLE IF NOT EXISTS application_nudges (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at        timestamptz DEFAULT now(),
  UNIQUE (application_id)
);

-- Service role only — no user-facing RLS needed.
ALTER TABLE application_nudges ENABLE ROW LEVEL SECURITY;
