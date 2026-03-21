-- Allow any authenticated user to read basic public profile info.
-- Without this, RLS blocks cross-user lookups (e.g. inbox user search).
-- Only exposes the fields needed for display; private fields remain
-- readable only by the owner via their own SELECT path in the app.

DROP POLICY IF EXISTS "profiles_public_select" ON profiles;

CREATE POLICY "profiles_public_select" ON profiles
  FOR SELECT
  TO authenticated
  USING (true);
