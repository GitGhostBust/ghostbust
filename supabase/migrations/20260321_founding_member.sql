-- ============================================================
-- GhostBust Founding Member
-- ============================================================

-- All existing and new users default to founding_member = true.
-- Flip to false manually when Phase 3 monetization launches.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS founding_member BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill existing rows
UPDATE profiles SET founding_member = TRUE WHERE founding_member IS NULL;
