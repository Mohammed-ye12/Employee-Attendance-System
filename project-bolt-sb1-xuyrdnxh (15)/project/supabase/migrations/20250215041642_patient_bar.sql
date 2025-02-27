/*
  # Initial Schema Setup

  1. Tables
    - Creates profiles table with role-based constraints
    - Creates shift_entries table with shift type validation
  
  2. Functions and Triggers
    - Adds updated_at timestamp handling
    - Sets up proper indexes for performance
  
  3. Security
    - Enables RLS on all tables
*/

-- Drop existing triggers and functions if they exist
DO $$ 
BEGIN
    -- Drop triggers if they exist
    DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;
    DROP TRIGGER IF EXISTS handle_shift_entries_updated_at ON shift_entries;
    
    -- Drop function if it exists
    DROP FUNCTION IF EXISTS handle_updated_at();
END $$;

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