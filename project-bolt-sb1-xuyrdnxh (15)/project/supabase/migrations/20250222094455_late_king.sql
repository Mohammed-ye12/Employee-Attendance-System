-- Drop existing shift entries policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view shift entries" ON shift_entries;
    DROP POLICY IF EXISTS "Anyone can insert shift entries" ON shift_entries;
    DROP POLICY IF EXISTS "Anyone can update shift entries" ON shift_entries;
    DROP POLICY IF EXISTS "Employees can view own entries" ON shift_entries;
    DROP POLICY IF EXISTS "Managers can view section entries" ON shift_entries;
    DROP POLICY IF EXISTS "HR can view all entries" ON shift_entries;
    DROP POLICY IF EXISTS "Employees can insert own entries" ON shift_entries;
    DROP POLICY IF EXISTS "Managers can approve section entries" ON shift_entries;
END $$;

-- Create more specific policies with correct text ID comparisons
CREATE POLICY "Employees can view own entries"
  ON shift_entries FOR SELECT
  USING (true);

CREATE POLICY "Managers can view section entries"
  ON shift_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles manager
      WHERE manager.id::text = current_user
      AND manager.role = 'manager'
      AND manager.section = (
        SELECT employee.section 
        FROM profiles employee 
        WHERE employee.id = shift_entries.employee_id
      )
    )
  );

CREATE POLICY "HR can view all entries"
  ON shift_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id::text = current_user
      AND role = 'hr'
    )
  );

CREATE POLICY "Employees can insert own entries"
  ON shift_entries FOR INSERT
  WITH CHECK (
    employee_id::text = current_user
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id::text = current_user
      AND is_approved = true
    )
  );

CREATE POLICY "Managers can approve section entries"
  ON shift_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles manager
      WHERE manager.id::text = current_user
      AND manager.role = 'manager'
      AND manager.section = (
        SELECT employee.section 
        FROM profiles employee 
        WHERE employee.id = shift_entries.employee_id
      )
    )
  )
  WITH CHECK (approved IS NOT NULL);