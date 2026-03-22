-- Extend resume_analyses for comprehensive advisor modes
ALTER TABLE resume_analyses
  ADD COLUMN IF NOT EXISTS mode              text DEFAULT 'job_specific',
  ADD COLUMN IF NOT EXISTS job_title         text,
  ADD COLUMN IF NOT EXISTS company_name      text,
  ADD COLUMN IF NOT EXISTS strength_score    integer,
  ADD COLUMN IF NOT EXISTS strength_justification text,
  ADD COLUMN IF NOT EXISTS formatting_feedback    text,
  ADD COLUMN IF NOT EXISTS writing_quality        text,
  ADD COLUMN IF NOT EXISTS missing_sections       text,
  ADD COLUMN IF NOT EXISTS industry_alignment     text,
  ADD COLUMN IF NOT EXISTS career_trajectory      text,
  ADD COLUMN IF NOT EXISTS red_flags              text,
  ADD COLUMN IF NOT EXISTS next_steps             text; -- JSON array of strings
