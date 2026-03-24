-- Tracks which onboarding emails have been sent to each user.
-- Prevents duplicate sends across cron runs.

CREATE TABLE IF NOT EXISTS email_sends (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type text        NOT NULL,  -- 'day_0' | 'day_2' | 'day_5' | 'day_14' | 'day_30'
  sent_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, email_type)
);

-- Only the service role (used by the cron) can read/write this table.
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
