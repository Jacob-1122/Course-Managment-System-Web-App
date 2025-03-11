/*
  # Add Helper Functions for Role-Based Authorization

  1. Functions
    - `is_admin` - Checks if a user has admin role
    - `is_instructor` - Checks if a user has instructor role

  2. Other Improvements
    - More flexible role checking for security
*/

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Function to check if user is instructor
CREATE OR REPLACE FUNCTION is_instructor(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role = 'instructor'
  );
END;
$$;

-- Update policies to use these functions
DO $$
BEGIN
  -- Update policies for viewing student records
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' AND policyname = 'Students can view own record'
  ) THEN
    DROP POLICY "Students can view own record" ON students;
  END IF;
  
  CREATE POLICY "Students can view own record"
    ON students
    FOR SELECT
    TO authenticated
    USING ((id = auth.uid()) OR is_admin(auth.uid()) OR is_instructor(auth.uid()));
  
  -- Update policies for viewing instructor records
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'instructors' AND policyname = 'Instructors can view own record'
  ) THEN
    DROP POLICY "Instructors can view own record" ON instructors;
  END IF;
  
  CREATE POLICY "Instructors can view own record"
    ON instructors
    FOR SELECT
    TO authenticated
    USING ((id = auth.uid()) OR is_admin(auth.uid()));
END;
$$;