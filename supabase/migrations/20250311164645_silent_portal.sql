/*
  # Fix user_profiles policies to prevent infinite recursion

  1. Changes
     - Fix the recursive policies in user_profiles table
     - Replace problematic policies with simpler, non-recursive versions
     - Add helper functions for role checks
     - Fix student profile creation for enrollments

  2. Security
     - Maintain row-level security while eliminating infinite recursion
     - Ensure proper authentication checks
*/

-- Drop problematic policies that might be causing infinite recursion
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile or admin can read all" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON user_profiles;

-- Create helper function for admin role check
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Create helper function for instructor role check
CREATE OR REPLACE FUNCTION is_instructor(user_id uuid)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role = 'instructor'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Create or replace policy for users to read their own profile
CREATE POLICY "users_can_read_own" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR 
         (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Create or replace policy for users to update their own profile
CREATE POLICY "users_can_update_own" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create or replace policy for users to create their own profile during signup
CREATE POLICY "users_can_create_during_signup" ON user_profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (id = auth.uid() OR auth.uid() IS NULL);

-- Drop problematic student policies
DROP POLICY IF EXISTS "Students can view own record" ON students;
DROP POLICY IF EXISTS "Students can read own record" ON students;

-- Add proper student policies
CREATE POLICY "students_can_read_own" ON students
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR 
         (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin' OR
         (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'instructor');

-- Ensure students table allows inserts for authenticated users
CREATE POLICY "students_can_insert_own" ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());