/*
  # Enable Instructor Course Management

  1. Changes
    - Drop existing policies
    - Create new policies for instructor course management
    - Add helper function for instructor checks

  2. Security
    - Instructors can only manage their own courses
    - Students and other users cannot modify courses
    - Everyone can view courses
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON courses;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON courses;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON courses;

-- Create new policies for instructor course management
CREATE POLICY "Instructors can create courses"
ON courses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM instructors
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Instructors can update own courses"
ON courses FOR UPDATE
TO authenticated
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Instructors can delete own courses"
ON courses FOR DELETE
TO authenticated
USING (instructor_id = auth.uid());

-- Helper function to check if user is instructor
CREATE OR REPLACE FUNCTION is_instructor(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM instructors
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy for reading courses
CREATE POLICY "Anyone can view courses"
ON courses FOR SELECT
TO authenticated
USING (true);