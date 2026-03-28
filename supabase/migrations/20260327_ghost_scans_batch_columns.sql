-- Add columns to ghost_scans for batch scanning and Ghost Job Index

ALTER TABLE ghost_scans
  ADD COLUMN IF NOT EXISTS job_title        text,
  ADD COLUMN IF NOT EXISTS company          text,
  ADD COLUMN IF NOT EXISTS job_board        text,
  ADD COLUMN IF NOT EXISTS ghost_score      integer,
  ADD COLUMN IF NOT EXISTS pattern_flags    text[],
  ADD COLUMN IF NOT EXISTS full_description text,
  ADD COLUMN IF NOT EXISTS posting_age_days integer,
  ADD COLUMN IF NOT EXISTS initiated_by     text DEFAULT 'system';

-- RLS: authenticated users can read all rows (if not already enabled)
ALTER TABLE ghost_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read scans" ON ghost_scans;
CREATE POLICY "Authenticated users can read scans"
  ON ghost_scans FOR SELECT
  TO authenticated
  USING (true);
