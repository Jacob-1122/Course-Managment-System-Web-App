/*
  # Authentication Setup

  1. Helper Functions
    - create_user_profile: Creates user profile and role-specific profile
    - get_user_profile: Retrieves user profile with role-specific data
    - is_admin: Checks if a user is an admin

  2. Security
    - Functions are security definer for proper access control
    - RLS policies for user profiles
*/

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
    ELSE
      -- For admin role, do nothing as it's handled separately
      NULL;
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

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE id = user_id
  );
END;
$$;

-- Update RLS policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile or admin can read all" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can read own profile or admin can read all"
ON user_profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.id = auth.uid()
  )
);

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());