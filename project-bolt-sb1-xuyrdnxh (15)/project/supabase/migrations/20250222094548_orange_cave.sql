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

-- Create more specific policies
CREATE POLICY "Enable read access for all users"
  ON shift_entries FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for employees"
  ON shift_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = shift_entries.employee_id
      AND profiles.is_approved = true
    )
  );

CREATE POLICY "Enable update for managers"
  ON shift_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles manager
      JOIN profiles employee ON manager.section = employee.section
      WHERE manager.id = shift_entries.approved_by
      AND manager.role = 'manager'
      AND employee.id = shift_entries.employee_id
    )
  );