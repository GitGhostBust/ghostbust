-- supabase/migrations/20260325_rate_limits.sql

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  count        INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- No public RLS policy — service role bypasses RLS by default.
-- Anon key has zero access to this table.

-- Atomic check-and-increment function.
-- Inserts a new row (count=1) or increments the existing row.
-- Resets count to 1 if the current window has expired.
-- Returns the new count and window_start so the caller can decide allowed/blocked.
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
  p_key            TEXT,
  p_limit          INT,
  p_window_seconds INT
)
RETURNS TABLE (count INT, window_start TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO rate_limits AS rl (key, window_start, count)
  VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE
    SET count        = CASE
                         WHEN rl.window_start < now() - (p_window_seconds || ' seconds')::interval
                         THEN 1
                         ELSE rl.count + 1
                       END,
        window_start = CASE
                         WHEN rl.window_start < now() - (p_window_seconds || ' seconds')::interval
                         THEN now()
                         ELSE rl.window_start
                       END;

  RETURN QUERY
    SELECT rl2.count, rl2.window_start
    FROM rate_limits rl2
    WHERE rl2.key = p_key;
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_increment_rate_limit(TEXT, INT, INT) TO service_role;
