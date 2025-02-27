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
    read IS NOT NULL
  );