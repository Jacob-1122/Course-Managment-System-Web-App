/*
  # Create admin user and authentication function

  1. Changes
    - Creates RPC function for admin authentication
    - Sets up secure admin profile checking

  2. Security
    - Uses email-based admin verification
    - Implements role-based access control
    - Protects admin authentication logic
*/

-- Create RPC function for admin authentication
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID, requested_role TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT
) AS $$
BEGIN
  -- For admin role, check against admin email
  IF requested_role = 'admin' THEN
    RETURN QUERY
    SELECT 
      u.id,
      u.email,
      COALESCE(up.name, 'System Administrator') as name,
      up.role
    FROM auth.users u
    LEFT JOIN user_profiles up ON u.id = up.id
    WHERE u.email = 'jacobtheracer@gmail.com'
    AND (up.role = 'admin' OR up.role IS NULL)
    LIMIT 1;
  ELSE
    -- For other roles, check normal user profiles
    RETURN QUERY
    SELECT 
      up.id,
      up.email,
      up.name,
      up.role
    FROM user_profiles up
    WHERE up.id = user_id
    AND up.role = requested_role
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;

  RETURN user_email = 'jacobtheracer@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify admin credentials
CREATE OR REPLACE FUNCTION verify_admin_access(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_email = 'jacobtheracer@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy helper function
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
  user_role TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;

  -- Check if user is admin
  IF user_email = 'jacobtheracer@gmail.com' THEN
    RETURN 'admin';
  END IF;

  -- Get role from user_profiles
  SELECT role INTO user_role
  FROM user_profiles
  WHERE id = user_id;

  RETURN COALESCE(user_role, 'student');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;