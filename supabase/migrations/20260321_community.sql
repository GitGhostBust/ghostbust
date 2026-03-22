-- ============================================================
-- GhostBust Community Board
-- ============================================================

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  topic         TEXT NOT NULL DEFAULT 'general',
  region        TEXT,
  photo_url     TEXT,
  likes_count   INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Post likes (one row per user per post)
CREATE TABLE IF NOT EXISTS post_likes (
  post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_topic_idx ON posts(topic);
CREATE INDEX IF NOT EXISTS posts_region_idx ON posts(region);
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "posts_select_all" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_auth" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Post likes policies
CREATE POLICY "post_likes_select_all" ON post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert_auth" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete_own" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "comments_select_all" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_auth" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for post photos (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-photos', 'post-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post-photos bucket
CREATE POLICY "post_photos_select_all" ON storage.objects FOR SELECT USING (bucket_id = 'post-photos');
CREATE POLICY "post_photos_insert_auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-photos' AND auth.uid() IS NOT NULL);
CREATE POLICY "post_photos_delete_own" ON storage.objects FOR DELETE USING (bucket_id = 'post-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
