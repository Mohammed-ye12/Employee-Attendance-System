/*
  # Fix Database Policies
  
  1. Drop existing policies to avoid conflicts
  2. Create new policies for profiles and shift entries
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop profiles policies
    DROP POLICY IF EXISTS "Anyone can create a profile" ON profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    DROP POLICY IF EXISTS "Users can view own entries" ON shift_entries;
    DROP POLICY IF EXISTS "Users can insert own entries" ON shift_entries;
END $$;

-- Create new policies
CREATE POLICY "Anyone can create a profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can view own entries"
  ON shift_entries FOR SELECT
  USING (employee_id = auth.uid());

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