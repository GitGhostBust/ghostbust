-- supabase/migrations/20260324_ghost_scans_share.sql

ALTER TABLE ghost_scans
  ADD COLUMN IF NOT EXISTS share_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scores       jsonb,
  ADD COLUMN IF NOT EXISTS confidence   integer,
  ADD COLUMN IF NOT EXISTS summary      text;

-- Allow anyone to read rows where share_enabled = true
-- (existing RLS enables authenticated user to read own rows;
--  this adds a second policy for public share access)
DROP POLICY IF EXISTS "Public can read shared scans" ON ghost_scans;
CREATE POLICY "Public can read shared scans"
  ON ghost_scans FOR SELECT
  USING (share_enabled = true);
