-- Drop activity history table and related objects
DROP TABLE IF EXISTS activity_history CASCADE;
DROP FUNCTION IF EXISTS log_shift_entry_activity() CASCADE;
DROP FUNCTION IF EXISTS log_profile_activity() CASCADE;
DROP FUNCTION IF EXISTS log_activity(text, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_activity_history() CASCADE;
DROP FUNCTION IF EXISTS set_activity_month_key() CASCADE;

-- Drop triggers from shift_entries and profiles
DROP TRIGGER IF EXISTS log_shift_entry_activity_trigger ON shift_entries;
DROP TRIGGER IF EXISTS log_profile_activity_trigger ON profiles;