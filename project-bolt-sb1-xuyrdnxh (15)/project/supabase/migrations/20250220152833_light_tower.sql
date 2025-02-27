/*
  # Views for Reporting

  1. Views
    - attendance_summary: Monthly attendance summary by employee
    - department_statistics: Statistics by department and section
    - manager_approval_stats: Manager approval statistics
*/

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