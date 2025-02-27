-- First drop existing tables and their dependencies
DROP TABLE IF EXISTS shift_entries CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Recreate profiles table with text ID
CREATE TABLE profiles (
  id text PRIMARY KEY,
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

-- Recreate shift entries table
CREATE TABLE shift_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text REFERENCES profiles(id) ON DELETE CASCADE,
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
  approved_by text REFERENCES profiles(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
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

-- Create policies for shift entries
CREATE POLICY "Anyone can view shift entries"
  ON shift_entries FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert shift entries"
  ON shift_entries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update shift entries"
  ON shift_entries FOR UPDATE
  USING (true);

-- Create indexes
CREATE INDEX idx_profiles_department ON profiles(department);
CREATE INDEX idx_profiles_section ON profiles(section);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_approved ON profiles(is_approved);
CREATE INDEX idx_shift_entries_date ON shift_entries(date);
CREATE INDEX idx_shift_entries_employee_id ON shift_entries(employee_id);
CREATE INDEX idx_shift_entries_approved ON shift_entries(approved);