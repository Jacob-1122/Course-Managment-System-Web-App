/*
  # Fix courses RLS policies and enable instructors functions

  1. Changes
    - Fix RLS policies for course management
    - Add helper function for checking instructor permissions

  2. Security
    - Properly handle admin access
    - Allow instructors to manage their own courses
*/

-- Drop existing course policies that might be problematic
DROP POLICY IF EXISTS "Instructors can create courses" ON courses;
DROP POLICY IF EXISTS "Instructors can update own courses" ON courses;
DROP POLICY IF EXISTS "Instructors can delete own courses" ON courses;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON courses;
DROP POLICY IF EXISTS "Anyone can view courses" ON courses;

-- Enable RLS on courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create new policies for courses using metadata functions
CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Instructors can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    is_instructor_from_metadata() OR is_admin_from_metadata()
  );

CREATE POLICY "Instructors can update own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (
    instructor_id = auth.uid() OR is_admin_from_metadata()
  )
  WITH CHECK (
    instructor_id = auth.uid() OR is_admin_from_metadata()
  );

CREATE POLICY "Instructors can delete own courses"
  ON courses FOR DELETE
  TO authenticated
  USING (
    instructor_id = auth.uid() OR is_admin_from_metadata()
  );

-- Create a function to get instructors with full permissions
CREATE OR REPLACE FUNCTION get_instructors_for_course_assignment() 
RETURNS TABLE (
  id UUID,
  name TEXT,
  department TEXT
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT 
    id,
    name,
    department
  FROM 
    instructors;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_instructors_for_course_assignment TO authenticated;

-- Ensure admins have access to all data
CREATE OR REPLACE FUNCTION admin_has_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$;