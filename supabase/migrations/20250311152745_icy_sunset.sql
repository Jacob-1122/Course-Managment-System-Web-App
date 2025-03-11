/*
  # Fix User Profile Management

  1. New Functions
    - create_user_profile: Creates user profile and role-specific record
    - get_user_profile: Retrieves user profile with role validation
    
  2. Changes
    - Add database functions for profile management
    - Improve role validation
    - Fix profile creation process
*/

-- Function to create a user profile with role-specific record
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id uuid,
  user_email text,
  user_name text,
  user_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into user_profiles
  INSERT INTO user_profiles (id, email, name, role)
  VALUES (user_id, user_email, user_name, user_role);

  -- Create role-specific profile
  CASE user_role
    WHEN 'admin' THEN
      INSERT INTO admins (id)
      VALUES (user_id);
    WHEN 'instructor' THEN
      INSERT INTO instructors (id, department)
      VALUES (user_id, 'Pending Assignment');
    WHEN 'student' THEN
      INSERT INTO students (id)
      VALUES (user_id);
    ELSE
      RAISE EXCEPTION 'Invalid role: %', user_role;
  END CASE;
END;
$$;

-- Function to get user profile with role validation
CREATE OR REPLACE FUNCTION get_user_profile(
  user_id uuid,
  requested_role text
)
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH profile AS (
    SELECT up.* FROM user_profiles up WHERE up.id = user_id
  )
  SELECT 
    p.id,
    p.email,
    p.name,
    p.role
  FROM profile p
  WHERE 
    CASE p.role
      WHEN 'admin' THEN EXISTS (SELECT 1 FROM admins WHERE id = user_id)
      WHEN 'instructor' THEN EXISTS (SELECT 1 FROM instructors WHERE id = user_id)
      WHEN 'student' THEN EXISTS (SELECT 1 FROM students WHERE id = user_id)
      ELSE false
    END
    AND p.role = requested_role;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid role or profile not found';
  END IF;
END;
$$;