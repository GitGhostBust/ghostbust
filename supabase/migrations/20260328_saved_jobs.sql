-- Saved jobs table for Find Jobs bookmark feature
CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  job_id text NOT NULL,
  title text,
  company text,
  location text,
  job_board text,
  posted timestamptz,
  description text,
  apply_url text,
  job_type text,
  salary text,
  min_salary numeric,
  max_salary numeric,
  employer_logo text,
  ghost_score integer,
  signal_flags jsonb DEFAULT '[]'::jsonb,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved jobs"
  ON saved_jobs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
