-- ============================================================
-- GhostBust Inbox: conversations + messages
-- Run this in the Supabase SQL editor or via supabase db push
-- ============================================================

-- 1. conversations
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_chat CHECK (participant_1 <> participant_2)
);

-- Prevent duplicate conversations between the same two users regardless of column order
DROP INDEX IF EXISTS conversations_unique_pair;
CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_pair
  ON conversations (
    LEAST(participant_1::text,    participant_2::text),
    GREATEST(participant_1::text, participant_2::text)
  );

-- 2. messages
CREATE TABLE IF NOT EXISTS messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body              TEXT NOT NULL CHECK (char_length(body) > 0),
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_read           BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- indexes for fast look-ups
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS messages_unread_idx          ON messages (conversation_id, is_read, sender_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

-- conversations: participants can read, insert, update
DROP POLICY IF EXISTS "conversations_select" ON conversations;
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

DROP POLICY IF EXISTS "conversations_insert" ON conversations;
CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (participant_1 = auth.uid() OR participant_2 = auth.uid());

DROP POLICY IF EXISTS "conversations_update" ON conversations;
CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- messages: users can read messages in their conversations
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

-- messages: users can only send as themselves, into their conversations
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

-- messages: participants can mark messages as read
DROP POLICY IF EXISTS "messages_update_read" ON messages;
CREATE POLICY "messages_update_read" ON messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );
