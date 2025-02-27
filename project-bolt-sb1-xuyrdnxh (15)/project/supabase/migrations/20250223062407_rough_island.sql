-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS cases CASCADE;

-- Create cases table
CREATE TABLE cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved')) DEFAULT 'open',
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_cases_employee_id ON cases(employee_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_created_at ON cases(created_at);

-- Create policies
CREATE POLICY "cases_select_policy"
  ON cases FOR SELECT
  USING (true);

CREATE POLICY "cases_insert_policy"
  ON cases FOR INSERT
  WITH CHECK (true);

CREATE POLICY "cases_update_policy"
  ON cases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = current_user
      AND profiles.role = 'hr'
    )
  );