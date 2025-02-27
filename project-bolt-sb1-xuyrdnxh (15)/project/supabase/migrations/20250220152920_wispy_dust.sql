/*
  # Shift Entries Policies

  1. Security
    - Drop existing policies to avoid conflicts
    - Create policies for shift entries table:
      - Users can view own entries
      - HR can view all entries
      - Managers can view section entries
      - Users can insert own entries
      - Managers can approve section entries
*/

-- Drop existing shift entries policies if they exist
DROP POLICY IF EXISTS "Users can view own entries" ON shift_entries;
DROP POLICY IF EXISTS "HR can view all entries" ON shift_entries;
DROP POLICY IF EXISTS "Managers can view section entries" ON shift_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON shift_entries;
DROP POLICY IF EXISTS "Managers can approve section entries" ON shift_entries;

-- Create shift entries policies
CREATE POLICY "Users can view own entries"
  ON shift_entries FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "HR can view all entries"
  ON shift_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'hr'
    )
  );

CREATE POLICY "Managers can view section entries"
  ON shift_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.section = p2.section
      WHERE p1.id = auth.uid()
      AND p1.role = 'manager'
      AND p2.id = shift_entries.employee_id
    )
  );

CREATE POLICY "Users can insert own entries"
  ON shift_entries FOR INSERT
  WITH CHECK (
    employee_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_approved = true
    )
  );

CREATE POLICY "Managers can approve section entries"
  ON shift_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.section = p2.section
      WHERE p1.id = auth.uid()
      AND p1.role = 'manager'
      AND p2.id = shift_entries.employee_id
    )
  )
  WITH CHECK (approved IS NOT NULL);