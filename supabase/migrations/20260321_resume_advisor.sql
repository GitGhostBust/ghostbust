-- ============================================================
-- Resume Advisor: resumes + resume_analyses tables + storage
-- ============================================================

-- RESUMES TABLE
CREATE TABLE IF NOT EXISTS resumes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url    text        NOT NULL,
  file_name   text        NOT NULL,
  extracted_text text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own resumes"
  ON resumes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RESUME ANALYSES TABLE
CREATE TABLE IF NOT EXISTS resume_analyses (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id        uuid        NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  job_listing_text text        NOT NULL,
  ghost_score      integer,
  fit_score        integer     NOT NULL,
  gap_analysis     text,
  bullet_rewrites  text,
  keyword_gaps     text,
  ats_feedback     text,
  cover_letter     text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own analyses"
  ON resume_analyses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- STORAGE BUCKET (resumes — private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760, -- 10 MB
  ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword']
)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
CREATE POLICY "Users can upload own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own resumes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own resumes"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own resumes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
