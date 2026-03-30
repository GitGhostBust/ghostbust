-- Ghostletter newsletter subscribers
CREATE TABLE IF NOT EXISTS ghostletter_subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  subscribed_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT ghostletter_subscribers_email_unique UNIQUE (email)
);

ALTER TABLE ghostletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone (anon) can subscribe
CREATE POLICY "anon can subscribe" ON ghostletter_subscribers
  FOR INSERT TO anon WITH CHECK (true);
