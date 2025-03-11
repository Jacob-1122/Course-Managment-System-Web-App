/*
  # Fix User Profile Creation and Instructor Schema

  1. Changes
    - Add create_user_profile RPC function
    - Update instructor table schema
    - Add helper functions for profile management

  2. Security
    - Implements secure profile creation
    - Maintains role-based access control
    - Handles different user types appropriately
*/

-- Update instructor table to include name
ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT
) RETURNS void AS $$
BEGIN
  -- Insert into user_profiles
  INSERT INTO user_profiles (id, email, name, role)
  VALUES (user_id, user_email, user_name, user_role);

  -- If role is instructor, create instructor profile
  IF user_role = 'instructor' THEN
    INSERT INTO instructors (id, name, department)
    VALUES (user_id, user_name, 'Pending');
  END IF;

  -- If role is student, create student profile
  IF user_role = 'student' THEN
    INSERT INTO students (id, name, email)
    VALUES (user_id, user_name, user_email);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_user_profile function to handle instructor data
CREATE OR REPLACE FUNCTION get_user_profile(
  user_id UUID,
  requested_role TEXT
) RETURNS TABLE (
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
      'System Administrator'::TEXT as name,
      'admin'::TEXT as role
    FROM auth.users u
    WHERE u.email = 'jacobtheracer@gmail.com'
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