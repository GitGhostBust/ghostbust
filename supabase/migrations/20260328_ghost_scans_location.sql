-- Add location columns to ghost_scans for Ghost Job Index geo data
ALTER TABLE ghost_scans
  ADD COLUMN IF NOT EXISTS job_city  text,
  ADD COLUMN IF NOT EXISTS job_state text;
