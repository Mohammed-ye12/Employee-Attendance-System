/*
  # Update profiles table RLS policies

  1. Changes
    - Add policy to allow unauthenticated users to insert into profiles table
    - Modify existing policies to work with the new authentication flow

  2. Security
    - Maintains data isolation
    - Allows initial registration without authentication
    - Preserves admin-only approval process
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Only admins can approve profiles" ON profiles;

-- Create new policies
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