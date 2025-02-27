-- Drop existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can create a profile" ON profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    DROP POLICY IF EXISTS "Only admins can update profiles" ON profiles;
    DROP POLICY IF EXISTS "Only admins can delete profiles" ON profiles;
END $$;

-- Create new policies that don't rely on auth
CREATE POLICY "Enable read access for all users"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users"
  ON profiles FOR UPDATE
  USING (true);

CREATE POLICY "Enable delete for all users"
  ON profiles FOR DELETE
  USING (true);

-- Update shift entries policies to not rely on auth.uid()
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own entries" ON shift_entries;
    DROP POLICY IF EXISTS "Users can insert own entries" ON shift_entries;
END $$;

CREATE POLICY "Anyone can view shift entries"
  ON shift_entries FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert shift entries"
  ON shift_entries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update shift entries"
  ON shift_entries FOR UPDATE
  USING (true);