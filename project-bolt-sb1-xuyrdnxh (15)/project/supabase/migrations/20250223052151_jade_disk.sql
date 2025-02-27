/*
  # Create notifications table and policies

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `type` (text, enum check)
      - `title` (text)
      - `message` (text)
      - `recipient_id` (text, references profiles)
      - `sender_id` (text, references profiles)
      - `read` (boolean)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for viewing and updating notifications
    - Add indexes for performance

  3. Changes
    - Create notifications table
    - Add necessary indexes
    - Set up RLS policies
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (
    type IN (
      'shift_approval',
      'shift_rejection',
      'registration_approval',
      'case_update',
      'urgent'
    )
  ),
  title text NOT NULL,
  message text NOT NULL,
  recipient_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id text REFERENCES profiles(id) ON DELETE SET NULL,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, read);

-- Create policies
CREATE POLICY "Enable read access for recipients"
  ON notifications FOR SELECT
  USING (recipient_id = current_user);

CREATE POLICY "Enable insert for all users"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for recipients"
  ON notifications FOR UPDATE
  USING (recipient_id = current_user)
  WITH CHECK (
    recipient_id = current_user AND
    read IS NOT NULL AND
    -- Only allow updating the read status
    recipient_id = OLD.recipient_id AND
    type = OLD.type AND
    title = OLD.title AND
    message = OLD.message AND
    sender_id IS NOT DISTINCT FROM OLD.sender_id AND
    metadata IS NOT DISTINCT FROM OLD.metadata AND
    created_at = OLD.created_at
  );