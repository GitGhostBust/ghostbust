-- ============================================================
-- GhostBust Follow System
-- ============================================================

CREATE TABLE IF NOT EXISTS follows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_follow  CHECK (follower_id <> following_id),
  CONSTRAINT unique_follow   UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_idx  ON follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows (following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read follows (needed for counts + follow-status checks)
DROP POLICY IF EXISTS "follows_select" ON follows;
CREATE POLICY "follows_select" ON follows
  FOR SELECT TO authenticated USING (true);

-- Users can only create their own follows
DROP POLICY IF EXISTS "follows_insert" ON follows;
CREATE POLICY "follows_insert" ON follows
  FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());

-- Users can only delete their own follows
DROP POLICY IF EXISTS "follows_delete" ON follows;
CREATE POLICY "follows_delete" ON follows
  FOR DELETE TO authenticated
  USING (follower_id = auth.uid());
