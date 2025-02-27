/*
  # Device Registration System
  
  1. New Tables
    - `device_registrations`: Tracks device-specific registrations
      - `id` (uuid, primary key)
      - `device_id` (text, unique)
      - `employee_id` (text, references profiles)
      - `last_login` (timestamptz)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on device_registrations table
    - Add policies for device registration management
    
  3. Indexes
    - Create indexes for device_id and employee_id
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

-- Create policies
CREATE POLICY "Enable insert for authenticated users"
  ON device_registrations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users"
  ON device_registrations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for own registrations"
  ON device_registrations FOR UPDATE
  TO authenticated
  USING (employee_id::text = current_user);

-- Create indexes
CREATE INDEX idx_device_registrations_device_id ON device_registrations(device_id);
CREATE INDEX idx_device_registrations_employee_id ON device_registrations(employee_id);