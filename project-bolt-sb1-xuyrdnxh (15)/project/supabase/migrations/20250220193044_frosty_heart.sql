-- First drop all existing policies for profiles
DO $$ 
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_name);
    END LOOP;
END $$;

-- Then create new policies
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

-- Do the same for shift_entries
DO $$ 
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'shift_entries'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON shift_entries', policy_name);
    END LOOP;
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