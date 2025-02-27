-- Drop existing objects if they exist
DO $$ 
BEGIN
    -- Drop triggers
    DROP TRIGGER IF EXISTS log_shift_entry_activity_trigger ON shift_entries;
    DROP TRIGGER IF EXISTS log_profile_activity_trigger ON profiles;
    DROP TRIGGER IF EXISTS set_activity_month_key_trigger ON activity_history;

    -- Drop functions
    DROP FUNCTION IF EXISTS log_shift_entry_activity();
    DROP FUNCTION IF EXISTS log_profile_activity();
    DROP FUNCTION IF EXISTS log_activity(text, text, text, jsonb);
    DROP FUNCTION IF EXISTS cleanup_old_activity_history();
    DROP FUNCTION IF EXISTS set_activity_month_key();

    -- Drop table
    DROP TABLE IF EXISTS activity_history CASCADE;
END $$;

-- Create activity_history table
CREATE TABLE activity_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL CHECK (
    action_type IN (
      'shift_entry',
      'shift_approval',
      'shift_rejection',
      'employee_registration',
      'employee_approval',
      'employee_rejection',
      'case_update',
      'notification_sent'
    )
  ),
  actor_id text REFERENCES profiles(id) ON DELETE SET NULL,
  target_id text REFERENCES profiles(id) ON DELETE SET NULL,
  details jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  month_key text
);

-- Enable RLS
ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_activity_history_action_type ON activity_history(action_type);
CREATE INDEX idx_activity_history_actor_id ON activity_history(actor_id);
CREATE INDEX idx_activity_history_target_id ON activity_history(target_id);
CREATE INDEX idx_activity_history_created_at ON activity_history(created_at);
CREATE INDEX idx_activity_history_month_key ON activity_history(month_key);

-- Create policies
CREATE POLICY "Enable read access for all users"
  ON activity_history FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all users"
  ON activity_history FOR INSERT
  WITH CHECK (true);

-- Create function to set month_key
CREATE OR REPLACE FUNCTION set_activity_month_key()
RETURNS TRIGGER AS $$
BEGIN
  NEW.month_key := to_char(NEW.created_at, 'YYYY-MM');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set month_key
CREATE TRIGGER set_activity_month_key_trigger
  BEFORE INSERT OR UPDATE ON activity_history
  FOR EACH ROW
  EXECUTE FUNCTION set_activity_month_key();

-- Create function to clean old activity history
CREATE OR REPLACE FUNCTION cleanup_old_activity_history()
RETURNS void AS $$
DECLARE
  current_month text;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  DELETE FROM activity_history
  WHERE month_key < current_month;
END;
$$ LANGUAGE plpgsql;

-- Create function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_action_type text,
  p_actor_id text,
  p_target_id text,
  p_details jsonb
)
RETURNS uuid AS $$
DECLARE
  v_activity_id uuid;
BEGIN
  INSERT INTO activity_history (
    action_type,
    actor_id,
    target_id,
    details
  ) VALUES (
    p_action_type,
    p_actor_id,
    p_target_id,
    p_details
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for shift entries
CREATE OR REPLACE FUNCTION log_shift_entry_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      'shift_entry',
      NEW.employee_id,
      NEW.employee_id,
      jsonb_build_object(
        'shift_type', NEW.shift_type,
        'date', NEW.date,
        'remark', NEW.other_remark
      )
    );
  ELSIF TG_OP = 'UPDATE' AND (NEW.approved IS DISTINCT FROM OLD.approved) THEN
    PERFORM log_activity(
      CASE WHEN NEW.approved THEN 'shift_approval' ELSE 'shift_rejection' END,
      NEW.approved_by,
      NEW.employee_id,
      jsonb_build_object(
        'shift_type', NEW.shift_type,
        'date', NEW.date,
        'remark', NEW.other_remark
      )
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for profiles
CREATE OR REPLACE FUNCTION log_profile_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      'employee_registration',
      NEW.id,
      NEW.id,
      jsonb_build_object(
        'full_name', NEW.full_name,
        'department', NEW.department,
        'section', NEW.section
      )
    );
  ELSIF TG_OP = 'UPDATE' AND (NEW.is_approved IS DISTINCT FROM OLD.is_approved) THEN
    PERFORM log_activity(
      CASE WHEN NEW.is_approved THEN 'employee_approval' ELSE 'employee_rejection' END,
      NEW.id,
      NEW.id,
      jsonb_build_object(
        'full_name', NEW.full_name,
        'department', NEW.department,
        'section', NEW.section
      )
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for logging
CREATE TRIGGER log_shift_entry_activity_trigger
  AFTER INSERT OR UPDATE ON shift_entries
  FOR EACH ROW
  EXECUTE FUNCTION log_shift_entry_activity();

CREATE TRIGGER log_profile_activity_trigger
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_activity();