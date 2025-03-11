/*
  # Add Helper Functions and Policies

  1. New Functions
    - `is_admin` - Check if a user is an admin
    - `is_instructor` - Check if a user is an instructor
    - `create_user_profile` - Creates user profile and role-specific profile
    - `get_user_profile` - Retrieves user profile with role-specific data
    - `handle_auth_user_created` - Trigger function for auth user creation

  2. Security
    - Add policies for authenticated users if they don't exist
    - Add policies for role-specific access if they don't exist
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

-- Function to create user profile
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into user_profiles
  INSERT INTO user_profiles (id, email, name, role)
  VALUES (user_id, user_email, user_name, user_role);

  -- Create role-specific profile
  CASE user_role
    WHEN 'student' THEN
      INSERT INTO students (id, name, email)
      VALUES (user_id, user_name, user_email);
    WHEN 'instructor' THEN
      INSERT INTO instructors (id, name, department)
      VALUES (user_id, user_name, 'Pending');
    WHEN 'admin' THEN
      INSERT INTO admins (id, security_level)
      VALUES (user_id, 'standard');
  END CASE;
END;
$$;

-- Function to get user profile
CREATE OR REPLACE FUNCTION get_user_profile(
  user_id UUID,
  requested_role TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.name,
    up.role
  FROM user_profiles up
  WHERE up.id = user_id
    AND up.role = requested_role;
END;
$$;

-- Enable RLS on all tables if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'user_profiles' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'students' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE students ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'instructors' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'admins' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'courses' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies if they don't exist
DO $$
BEGIN
  -- Policies for courses
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'courses' 
    AND policyname = 'Anyone can view courses'
  ) THEN
    CREATE POLICY "Anyone can view courses"
    ON courses FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'courses' 
    AND policyname = 'Instructors can create courses'
  ) THEN
    CREATE POLICY "Instructors can create courses"
    ON courses FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND (role = 'instructor' OR role = 'admin')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'courses' 
    AND policyname = 'Instructors can update own courses'
  ) THEN
    CREATE POLICY "Instructors can update own courses"
    ON courses FOR UPDATE
    TO authenticated
    USING (instructor_id = auth.uid())
    WITH CHECK (instructor_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'courses' 
    AND policyname = 'Instructors can delete own courses'
  ) THEN
    CREATE POLICY "Instructors can delete own courses"
    ON courses FOR DELETE
    TO authenticated
    USING (instructor_id = auth.uid());
  END IF;
END $$;

-- Create trigger function for auth user creation
CREATE OR REPLACE FUNCTION handle_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create user profile and role-specific records
  PERFORM create_user_profile(
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_created();