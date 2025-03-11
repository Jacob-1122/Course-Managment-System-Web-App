/*
  # Add Helper Functions for Role-Based Authorization

  1. New Functions
    - `is_admin_from_metadata` - Checks if a user has admin role based on JWT
    - `is_instructor_from_metadata` - Checks if a user has instructor role based on JWT
    - `is_student_from_metadata` - Checks if a user has student role based on JWT

  2. Security
    - Add functions to check roles from metadata
    - Avoid creating demo users that violate foreign key constraints
*/

-- Helper function for admin check
CREATE OR REPLACE FUNCTION is_admin_from_metadata()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for instructor check
CREATE OR REPLACE FUNCTION is_instructor_from_metadata()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'instructor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for student check
CREATE OR REPLACE FUNCTION is_student_from_metadata()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'student'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely check if auth user exists
CREATE OR REPLACE FUNCTION auth_user_exists(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set correct RLS policies for the logs table
DROP POLICY IF EXISTS "Admins can read all logs" ON logs;
CREATE POLICY "Admins can read all logs"
  ON logs
  FOR SELECT
  TO authenticated
  USING (is_admin_from_metadata());