/*
  # Fix foreign key constraint and add manager profiles

  1. Changes
    - Drop and recreate foreign key constraint with proper ON DELETE behavior
    - Add initial manager profiles
    - Update existing shift entries to handle NULL approved_by values

  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity with updated constraints
*/

-- First clean up any dangling references
UPDATE shift_entries 
SET approved_by = NULL 
WHERE approved_by IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM profiles WHERE id = shift_entries.approved_by
);

-- Drop and recreate the foreign key constraint
ALTER TABLE shift_entries
DROP CONSTRAINT IF EXISTS shift_entries_approved_by_fkey;

ALTER TABLE shift_entries
ADD CONSTRAINT shift_entries_approved_by_fkey
FOREIGN KEY (approved_by) REFERENCES profiles(id)
ON DELETE SET NULL;

-- Add initial manager profiles if they don't exist
INSERT INTO profiles (id, full_name, department, section, role, is_approved)
VALUES
  ('QC_MGR', 'QC Manager', 'Engineering', 'QC', 'manager', true),
  ('RTG_MGR', 'RTG Manager', 'Engineering', 'RTG', 'manager', true),
  ('MES_MGR', 'MES Manager', 'Engineering', 'MES', 'manager', true),
  ('PLN_MGR', 'Planning Manager', 'Engineering', 'Planning', 'manager', true),
  ('STR_MGR', 'Store Manager', 'Engineering', 'Store', 'manager', true),
  ('INF_MGR', 'Infra Manager', 'Engineering', 'Infra', 'manager', true),
  ('SHIFT_MGR', 'Shift Manager', 'Engineering', 'Shift Incharge', 'manager', true)
ON CONFLICT (id) DO UPDATE
SET 
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  section = EXCLUDED.section,
  role = EXCLUDED.role,
  is_approved = EXCLUDED.is_approved;