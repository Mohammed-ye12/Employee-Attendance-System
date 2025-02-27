-- Drop existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable read for everyone" ON device_registrations;
    DROP POLICY IF EXISTS "Enable insert for everyone" ON device_registrations;
    DROP POLICY IF EXISTS "Enable update for matching device" ON device_registrations;
END $$;

-- Recreate device_registrations table with proper constraints
DROP TABLE IF EXISTS device_registrations CASCADE;
CREATE TABLE device_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  employee_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_login timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(device_id)
);

-- Enable RLS
ALTER TABLE device_registrations ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies
CREATE POLICY "Allow all operations"
  ON device_registrations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_device_registrations_device_id ON device_registrations(device_id);
CREATE INDEX idx_device_registrations_employee_id ON device_registrations(employee_id);