/*
  # Fix Authentication Functions

  1. Changes
    - Fix ambiguous id reference in get_user_profile
    - Add proper constraints for students table
    - Update create_user_profile to handle required fields
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
      INSERT INTO instructors (id, department, name)
      VALUES (user_id, 'Pending Assignment', user_name);
    WHEN 'student' THEN
      INSERT INTO students (id, name, email)
      VALUES (user_id, user_name, user_email);
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
      WHEN 'admin' THEN EXISTS (SELECT 1 FROM admins a WHERE a.id = p.id)
      WHEN 'instructor' THEN EXISTS (SELECT 1 FROM instructors i WHERE i.id = p.id)
      WHEN 'student' THEN EXISTS (SELECT 1 FROM students s WHERE s.id = p.id)
      ELSE false
    END
    AND p.role = requested_role;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid role or profile not found';
  END IF;
END;
$$;