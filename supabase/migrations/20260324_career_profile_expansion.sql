-- Career Profile Expansion: 8 new career field columns + 9 visibility toggle columns

-- 8 new career field columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS experience_years    varchar,
  ADD COLUMN IF NOT EXISTS seniority_level     varchar,
  ADD COLUMN IF NOT EXISTS work_arrangement    varchar,
  ADD COLUMN IF NOT EXISTS target_roles        text,
  ADD COLUMN IF NOT EXISTS target_salary_band  varchar,
  ADD COLUMN IF NOT EXISTS search_duration     varchar,
  ADD COLUMN IF NOT EXISTS career_goal         text,
  ADD COLUMN IF NOT EXISTS skills              text;

-- 9 new visibility toggle columns (show_industry + 8 for new fields)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_industry             boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_experience_years     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_seniority_level      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_work_arrangement     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_target_roles         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_target_salary_band   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_search_duration      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_career_goal          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_skills               boolean DEFAULT false;
