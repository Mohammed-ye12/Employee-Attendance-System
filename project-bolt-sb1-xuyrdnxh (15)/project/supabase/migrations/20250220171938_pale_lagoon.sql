/*
  # Fix Policy Conflicts
  
  1. Drop existing policies to avoid conflicts
  2. Recreate policies with proper checks
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop profiles policies
    DROP POLICY IF EXISTS "Only admins can update profiles" ON profiles;
    DROP POLICY IF EXISTS "Only admins can delete profiles" ON profiles;
    DROP POLICY IF EXISTS "Anyone can create a profile" ON profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    
    -- Drop shift entries policies
    DROP POLICY IF EXISTS "Users can view own entries" ON shift_entries;
    DROP POLICY IF EXISTS "HR can view all entries" ON shift_entries;
    DROP POLICY IF EXISTS "Managers can view section entries" ON shift_entries;
    DROP POLICY IF EXISTS "Users can insert own entries" ON shift_entries;
    DROP POLICY IF EXISTS "Managers can approve section entries" ON shift_entries;
END $$;

-- Recreate profiles policies
CREATE POLICY "Anyone can create a profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Recreate shift entries policies
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