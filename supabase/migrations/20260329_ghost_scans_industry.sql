-- Add industry column to ghost_scans
ALTER TABLE ghost_scans ADD COLUMN IF NOT EXISTS industry text;
