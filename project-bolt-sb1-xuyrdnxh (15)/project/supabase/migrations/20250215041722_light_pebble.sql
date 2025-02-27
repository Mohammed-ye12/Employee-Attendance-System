/*
  # Fix Audit Triggers

  1. Changes
    - Drops existing audit triggers if they exist
    - Recreates audit triggers for both profiles and shift_entries tables
  
  2. Purpose
    - Ensures clean recreation of audit triggers without conflicts
    - Maintains audit logging functionality
*/

-- Drop existing audit triggers if they exist
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS audit_profiles_changes ON profiles;
    DROP TRIGGER IF EXISTS audit_shift_entries_changes ON shift_entries;
END $$;

-- Recreate Audit Triggers
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE TRIGGER audit_shift_entries_changes
  AFTER INSERT OR UPDATE OR DELETE ON shift_entries
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();