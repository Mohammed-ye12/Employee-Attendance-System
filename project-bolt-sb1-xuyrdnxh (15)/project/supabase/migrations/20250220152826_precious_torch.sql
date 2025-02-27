/*
  # Functions and Triggers

  1. Functions
    - handle_updated_at: Updates the updated_at timestamp
    - validate_shift_conflict: Validates shift entries for conflicts
    - calculate_overtime_hours: Calculates overtime hours

  2. Triggers
    - Automatically update updated_at timestamps
    - Validate shift conflicts before insert
*/

-- Functions
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_shift_conflict(
  p_employee_id uuid,
  p_date date,
  p_shift_type text
)
RETURNS boolean AS $$
BEGIN
  -- Check if employee already has a shift on the same date
  IF EXISTS (
    SELECT 1 
    FROM shift_entries 
    WHERE employee_id = p_employee_id 
    AND date = p_date
  ) THEN
    RETURN false;
  END IF;
  
  -- Check if employee has consecutive night shifts
  IF p_shift_type = '3rd_shift' AND EXISTS (
    SELECT 1 
    FROM shift_entries 
    WHERE employee_id = p_employee_id 
    AND date = p_date - interval '1 day'
    AND shift_type = '3rd_shift'
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_overtime_hours(
  p_shift_type text,
  p_date date
)
RETURNS numeric AS $$
DECLARE
  base_hours numeric;
BEGIN
  base_hours := CASE
    WHEN p_shift_type = 'ot_off_day' THEN 8
    WHEN p_shift_type = 'ot_week_off' THEN 8
    WHEN p_shift_type = 'ot_public_holiday' THEN 8
    ELSE 0
  END;
  
  RETURN base_hours;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_shift_entries_updated_at
  BEFORE UPDATE ON shift_entries
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();