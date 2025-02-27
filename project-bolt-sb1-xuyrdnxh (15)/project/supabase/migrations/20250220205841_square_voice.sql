-- Update the section check constraint for profiles table
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_section_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_section_check 
  CHECK (
    (department = 'Engineering' AND section IN ('QC', 'RTG', 'MES', 'Shift Incharge', 'Planning', 'Store', 'Infra', 'Others')) OR
    (department != 'Engineering' AND section IS NULL)
  );