-- Allow job_listing_text to be null for General Resume Review analyses
ALTER TABLE resume_analyses ALTER COLUMN job_listing_text DROP NOT NULL;
