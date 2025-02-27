/*
  # Fix Database Triggers

  1. Changes
    - Safely drops existing triggers if they exist
    - Recreates necessary triggers for both tables
  
  2. Purpose
    - Ensures clean recreation of triggers without conflicts
    - Maintains data update tracking functionality
*/

-- Drop existing triggers if they exist
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;
    DROP TRIGGER IF EXISTS handle_shift_entries_updated_at ON shift_entries;
END $$;

-- Recreate Triggers
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_shift_entries_updated_at
  BEFORE UPDATE ON shift_entries
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();