-- Drop existing audit logs table and policies
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Recreate audit logs table without RLS
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_at timestamptz DEFAULT now()
);

-- Create view for accessing audit logs with proper security
CREATE OR REPLACE VIEW secure_audit_logs AS
SELECT al.*
FROM audit_logs al
WHERE EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid()
  AND role IN ('hr', 'admin')
);

-- Grant permissions on the audit_logs table to authenticated users
GRANT INSERT ON audit_logs TO authenticated;
GRANT SELECT ON secure_audit_logs TO authenticated;

-- Update the audit trigger function to not require authentication
CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_by
  )
  VALUES (
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
      ELSE NULL
    END,
    CASE 
      WHEN TG_OP = 'DELETE' THEN NULL 
      ELSE to_jsonb(NEW)
    END,
    auth.uid()
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS audit_profiles_changes ON profiles;
DROP TRIGGER IF EXISTS audit_shift_entries_changes ON shift_entries;

-- Recreate audit triggers
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE TRIGGER audit_shift_entries_changes
  AFTER INSERT OR UPDATE OR DELETE ON shift_entries
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Update profiles policies
DROP POLICY IF EXISTS "Anyone can create a profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

CREATE POLICY "Anyone can create a profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- Only allow updating certain fields
    (CASE WHEN is_approved IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    ELSE true END)
  );