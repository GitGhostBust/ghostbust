-- Enable Supabase Realtime on the inbox tables.
-- Without this, postgres_changes subscriptions receive no events at all.
--
-- REPLICA IDENTITY FULL ensures all column values are present in the WAL
-- record for every event type, making server-side column filters reliable.

ALTER TABLE messages      REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
