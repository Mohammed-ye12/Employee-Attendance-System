/*
  # Fix notifications update policy

  1. Changes
    - Drop existing update policy
    - Create new update policy with proper check conditions
    - Add index for performance

  2. Security
    - Maintain same security model where recipients can only update read status
    - Prevent modification of other fields
*/

-- Drop existing update policy
DROP POLICY IF EXISTS "Recipients can update own notifications" ON notifications;

-- Create new update policy with fixed conditions
CREATE POLICY "Recipients can update own notifications"
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

-- Add index to improve policy performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read 
  ON notifications(recipient_id, read);