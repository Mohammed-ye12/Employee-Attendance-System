/*
  # Fix Registration and Admin Approval
  
  1. Ensure tables exist with proper structure
  2. Add necessary indexes and constraints
  3. Update policies for registration workflow
*/

-- Create profiles table if not exists
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

-- Create shift entries table if not exists
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

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can create a profile" ON profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
END $$;

-- Create new policies
CREATE POLICY "Anyone can create a profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);