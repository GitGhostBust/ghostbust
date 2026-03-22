-- Allow GhostBustOfficial admin to delete any resume record
CREATE POLICY "Admin can delete any resume"
  ON resumes FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE username = 'GhostBustOfficial'
    )
  );

-- Allow GhostBustOfficial admin to delete any resume storage object
CREATE POLICY "Admin can delete any resume file"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes'
    AND auth.uid() IN (
      SELECT id FROM profiles WHERE username = 'GhostBustOfficial'
    )
  );
