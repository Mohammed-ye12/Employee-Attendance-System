/*
  # Performance Optimization and Views

  1. Additional Indexes
    - Add composite indexes for common query patterns
    - Add indexes for frequently filtered columns
  
  2. Views
    - Create view for employee attendance summary
    - Create view for department statistics
    - Create view for manager approvals

  3. Functions
    - Add function to calculate overtime hours
    - Add function to validate shift conflicts
*/

-- Additional Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_shift_entries_employee_date 
  ON shift_entries(employee_id, date);

CREATE INDEX IF NOT EXISTS idx_shift_entries_department 
  ON profiles(department) 
  WHERE department = 'Engineering';

-- Views for Reporting
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
  p.id as employee_id,
  p.full_name,
  p.department,
  p.section,
  date_trunc('month', s.date) as month,
  COUNT(*) FILTER (WHERE s.shift_type IN ('1st_shift', '2nd_shift', '3rd_shift')) as regular_shifts,
  COUNT(*) FILTER (WHERE s.shift_type LIKE 'ot%') as overtime_shifts,
  COUNT(*) FILTER (WHERE s.shift_type IN ('leave', 'medical')) as leave_count
FROM profiles p
LEFT JOIN shift_entries s ON p.id = s.employee_id
GROUP BY p.id, p.full_name, p.department, p.section, date_trunc('month', s.date);

CREATE OR REPLACE VIEW department_statistics AS
SELECT 
  department,
  section,
  COUNT(DISTINCT p.id) as employee_count,
  COUNT(DISTINCT s.id) FILTER (WHERE s.approved = true) as approved_entries,
  COUNT(DISTINCT s.id) FILTER (WHERE s.approved = false) as pending_entries
FROM profiles p
LEFT JOIN shift_entries s ON p.id = s.employee_id
GROUP BY department, section;

CREATE OR REPLACE VIEW manager_approval_stats AS
SELECT 
  m.id as manager_id,
  m.full_name as manager_name,
  m.section,
  COUNT(DISTINCT s.id) as total_approvals,
  AVG(EXTRACT(EPOCH FROM (s.approved_at - s.created_at))/3600)::numeric(10,2) as avg_approval_hours
FROM profiles m
JOIN shift_entries s ON s.approved_by = m.id
WHERE m.role = 'manager'
GROUP BY m.id, m.full_name, m.section;

-- Functions
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