/*
  # Setup core database schema

  1. Core Tables
    - `user_profiles` - Base user information
    - `students` - Student-specific information
    - `instructors` - Instructor-specific information
  
  2. Helper Functions
    - `create_user_profile` - Creates profiles for new users
    - `get_user_profile` - Retrieves user profile data
  
  3. Security
    - Enable RLS on all tables
    - Create policies for authenticated users
*/

-- Create academic status enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'academic_status_type') THEN
    CREATE TYPE academic_status_type AS ENUM ('active', 'inactive', 'graduated', 'suspended');
  END IF;
END$$;

-- Create base user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
  profile_url text,
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  academic_status academic_status_type DEFAULT 'active',
  academic_advisor uuid,
  created_at timestamptz DEFAULT now()
);

-- Create index on students table
CREATE INDEX IF NOT EXISTS idx_students_status ON students(academic_status);
CREATE INDEX IF NOT EXISTS idx_students_advisor ON students(academic_advisor);

-- Create instructors table
CREATE TABLE IF NOT EXISTS instructors (
  id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  department text NOT NULL,
  title text,
  specialization text[],
  office_hours jsonb,
  contact_info jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create index on instructors table
CREATE INDEX IF NOT EXISTS idx_instructors_department ON instructors(department);

-- Enable RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles' AND rowsecurity = true) THEN
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'students' AND rowsecurity = true) THEN
    ALTER TABLE students ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'instructors' AND rowsecurity = true) THEN
    ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
  END IF;
END$$;

-- User profiles policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can read own profile') THEN
    CREATE POLICY "Users can read own profile"
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile"
      ON user_profiles
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END$$;

-- Students policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Students can read own record') THEN
    CREATE POLICY "Students can read own record"
      ON students
      FOR SELECT
      TO authenticated
      USING (id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
      ) OR EXISTS (
        SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'instructor'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Students can update own record') THEN
    CREATE POLICY "Students can update own record"
      ON students
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END$$;

-- Instructors policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'instructors' AND policyname = 'Instructors can read own record') THEN
    CREATE POLICY "Instructors can read own record"
      ON instructors
      FOR SELECT
      TO authenticated
      USING (id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'instructors' AND policyname = 'Instructors can update own record') THEN
    CREATE POLICY "Instructors can update own record"
      ON instructors
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END$$;

-- Helper functions
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id uuid,
  user_email text,
  user_name text,
  user_role text
) RETURNS void AS $$
BEGIN
  -- Insert base user profile
  INSERT INTO user_profiles (id, email, name, role)
  VALUES (user_id, user_email, user_name, user_role);

  -- Create role-specific profile
  CASE user_role
    WHEN 'student' THEN
      INSERT INTO students (id, name, email)
      VALUES (user_id, user_name, user_email);
    WHEN 'instructor' THEN
      INSERT INTO instructors (id, name, department)
      VALUES (user_id, user_name, 'Pending Assignment');
    ELSE
      -- Admin role doesn't need additional profile
      NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing function if it exists to avoid signature mismatch
DROP FUNCTION IF EXISTS get_user_profile(uuid, text);

-- Create function with correct signature
CREATE FUNCTION get_user_profile(
  user_id uuid,
  requested_role text
) RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.name,
    up.role
  FROM user_profiles up
  WHERE up.id = user_id AND up.role = requested_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;