-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS notifications CASCADE;

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
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_id, read);

-- Create policies with unique names
CREATE POLICY "notifications_select_policy" 
  ON notifications FOR SELECT 
  USING (true);

CREATE POLICY "notifications_insert_policy" 
  ON notifications FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "notifications_update_policy" 
  ON notifications FOR UPDATE 
  USING (true)
  WITH CHECK (read IS NOT NULL);