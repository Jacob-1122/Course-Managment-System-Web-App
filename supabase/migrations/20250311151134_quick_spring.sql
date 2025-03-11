/*
  # Update course schema and add logging

  1. Changes
    - Add new columns to courses table:
      - code (text)
      - max_capacity (integer)
      - current_enrollment (integer)
    - Rename faculty column to department
    - Add logs table for activity tracking

  2. Security
    - Enable RLS on logs table
    - Add policies for logs table
*/

-- Update courses table
ALTER TABLE courses 
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS max_capacity integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS current_enrollment integer DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'faculty'
  ) THEN
    ALTER TABLE courses RENAME COLUMN faculty TO department;
  END IF;
END $$;

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  performed_by uuid REFERENCES auth.users(id),
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on logs
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Policies for logs
CREATE POLICY "Admins can read all logs"
  ON logs
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can create logs"
  ON logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update enrollment status
ALTER TABLE enrollments 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'enrolled'
  CHECK (status IN ('enrolled', 'waitlisted', 'completed'));