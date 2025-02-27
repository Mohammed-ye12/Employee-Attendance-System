/*
  # Initial Schema Setup

  1. Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `department` (text)
      - `section` (text, nullable)
      - `role` (text)
      - `is_approved` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `shift_entries`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references profiles)
      - `date` (date)
      - `shift_type` (text)
      - `other_remark` (text, nullable)
      - `approved` (boolean)
      - `approved_by` (uuid, references profiles)
      - `approved_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add basic policies for each table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_section ON profiles(section);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_shift_entries_date ON shift_entries(date);
CREATE INDEX IF NOT EXISTS idx_shift_entries_employee_id ON shift_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_entries_approved ON shift_entries(approved);
CREATE INDEX IF NOT EXISTS idx_shift_entries_employee_date ON shift_entries(employee_id, date);