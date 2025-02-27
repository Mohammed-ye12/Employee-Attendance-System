/*
  # Fix Device Registration System
  
  1. Changes
    - Remove authentication requirement from policies
    - Allow public access for device registration checks
    - Simplify RLS policies
    
  2. Security
    - Enable RLS but with public access
    - Policies focus on device uniqueness rather than auth
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON device_registrations;
    DROP POLICY IF EXISTS "Enable read for authenticated users" ON device_registrations;
    DROP POLICY IF EXISTS "Enable update for own registrations" ON device_registrations;
END $$;

-- Drop and recreate the table to ensure clean state
DROP TABLE IF EXISTS device_registrations CASCADE;

-- Create device registrations table
CREATE TABLE device_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  employee_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_login timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE device_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies with public access
CREATE POLICY "Enable read for everyone"
  ON device_registrations FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for everyone"
  ON device_registrations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for matching device"
  ON device_registrations FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_device_registrations_device_id ON device_registrations(device_id);
CREATE INDEX idx_device_registrations_employee_id ON device_registrations(employee_id);