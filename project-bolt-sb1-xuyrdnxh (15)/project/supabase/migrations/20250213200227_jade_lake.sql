/*
  # Initial Database Schema

  1. New Tables
    - `profiles`
      - Stores user profile information
      - Links to Supabase auth.users
      - Includes department and section data
    
    - `shift_entries`
      - Stores attendance records
      - Links to profiles
      - Includes approval workflow data

  2. Security
    - Enable RLS on all tables
    - Policies for data access based on user role and section
    - Secure password handling through Supabase Auth

  3. Relationships
    - Foreign key constraints
    - Cascading updates/deletes where appropriate
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  department text NOT NULL CHECK (department IN ('Operations', 'Engineering', 'Human Resource', 'Finance', 'Safety', 'IT', 'Security', 'Planning', 'Others')),
  section text CHECK (
    (department = 'Engineering' AND section IN ('QC', 'RTG', 'MES', 'Planning', 'Store', 'Infra', 'Others')) OR
    (department != 'Engineering' AND section IS NULL)
  ),
  role text NOT NULL CHECK (role IN ('employee', 'manager', 'hr', 'admin')) DEFAULT 'employee',
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create shift entries table
CREATE TABLE IF NOT EXISTS shift_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  shift_type text NOT NULL CHECK (
    shift_type IN (
      '1st_shift', '2nd_shift', '3rd_shift',
      'leave', 'medical',
      'ot_off_day', 'ot_week_off', 'ot_public_holiday',
      'other'
    )
  ),
  other_remark text,
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_entries ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Only admins can approve profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (is_approved IS NOT NULL);

-- Shift entries policies
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

-- Functions
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_shift_entries_updated_at
  BEFORE UPDATE ON shift_entries
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_section ON profiles(section);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_shift_entries_date ON shift_entries(date);
CREATE INDEX IF NOT EXISTS idx_shift_entries_employee_id ON shift_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_entries_approved ON shift_entries(approved);