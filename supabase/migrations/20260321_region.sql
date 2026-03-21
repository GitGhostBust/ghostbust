-- ============================================================
-- GhostBust Region Selection
-- ============================================================

-- Add region columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS job_market_region  TEXT,
  ADD COLUMN IF NOT EXISTS job_market_state   TEXT,
  ADD COLUMN IF NOT EXISTS job_market_country TEXT,
  ADD COLUMN IF NOT EXISTS job_market_open    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS region_set         BOOLEAN NOT NULL DEFAULT FALSE;

-- Add region columns to ghost_scans
ALTER TABLE ghost_scans
  ADD COLUMN IF NOT EXISTS job_market_region  TEXT,
  ADD COLUMN IF NOT EXISTS job_market_state   TEXT,
  ADD COLUMN IF NOT EXISTS job_market_country TEXT;
