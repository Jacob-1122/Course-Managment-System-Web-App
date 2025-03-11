/*
  # Fix User Profiles and Authentication System

  1. Changes
     - Fix infinite recursion in user_profiles policies
     - Add helper functions for role checking
     - Improve access control for students and user profiles

  2. Security
     - Maintain proper role-based security using safer policy patterns
     - Avoid self-referential policies that cause infinite recursion
*/

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "users_can_read_own" ON user_profiles;
DROP POLICY IF EXISTS "users_can_update_own" ON user_profiles;
DROP POLICY IF EXISTS "users_can_create_during_signup" ON user_profiles;
DROP POLICY IF EXISTS "students_can_read_own" ON students;

-- Create safe helper functions for role checking
CREATE OR REPLACE FUNCTION is_admin_from_metadata()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_instructor_from_metadata() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'instructor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_student_from_metadata() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'student'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create safer policies for user_profiles
CREATE POLICY "allow_users_to_read_own_profile" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR is_admin_from_metadata());

CREATE POLICY "allow_users_to_update_own_profile" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "allow_users_to_create_profile_during_signup" ON user_profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (id = auth.uid() OR auth.uid() IS NULL);

-- Create safer policies for students
CREATE POLICY "allow_students_to_read_own_record" ON students
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR is_admin_from_metadata() OR is_instructor_from_metadata());

CREATE POLICY "allow_students_to_update_own_record" ON students
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "allow_students_to_create_own_record" ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Check if function exists before dropping
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'get_user_profile_direct'
  ) THEN
    DROP FUNCTION get_user_profile_direct(UUID);
  END IF;
END
$$;

-- Create direct access function with a new name to avoid conflicts
CREATE FUNCTION get_user_profile_direct(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT, 
  role TEXT
) 
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT 
    id,
    email,
    name,
    role
  FROM 
    user_profiles
  WHERE 
    id = user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profile_direct TO authenticated;