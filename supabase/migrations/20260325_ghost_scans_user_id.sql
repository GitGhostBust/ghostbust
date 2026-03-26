-- supabase/migrations/20260325_ghost_scans_user_id.sql

ALTER TABLE ghost_scans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_ghost_scans_user_id ON ghost_scans(user_id);
