/*
  # Add notifications system

  1. New Tables
    - notifications
      - id (uuid, primary key)
      - type (text, notification type)
      - title (text)
      - message (text)
      - recipient_id (text, references profiles)
      - sender_id (text, references profiles)
      - read (boolean)
      - metadata (jsonb)
      - created_at (timestamptz)

  2. Security
    - Enable RLS on notifications table
    - Add policies for:
      - Recipients can view their own notifications
      - Senders can create notifications
      - Recipients can mark notifications as read
*/

-- Create notifications table
CREATE TABLE notifications (
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
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Create policies
CREATE POLICY "Recipients can view own notifications"
  ON notifications FOR SELECT
  USING (recipient_id = current_user);

CREATE POLICY "Anyone can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Recipients can update own notifications"
  ON notifications FOR UPDATE
  USING (recipient_id = current_user)
  WITH CHECK (
    -- Only allow updating the read status
    (
      OLD.recipient_id = current_user AND
      OLD.type = NEW.type AND
      OLD.title = NEW.title AND
      OLD.message = NEW.message AND
      OLD.recipient_id = NEW.recipient_id AND
      OLD.sender_id = NEW.sender_id AND
      OLD.metadata = NEW.metadata AND
      OLD.created_at = NEW.created_at
    )
  );