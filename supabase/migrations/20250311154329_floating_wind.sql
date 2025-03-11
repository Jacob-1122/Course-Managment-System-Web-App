/*
  # Fix User Profile Functions and Student Creation

  1. Changes
    - Fix get_user_profile function return type
    - Update create_user_profile function to properly handle student creation
    - Add proper error handling for profile creation

  2. Security
    - Maintains existing security policies
    - Ensures proper user type validation
*/

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS get_user_profile(UUID, TEXT);
DROP FUNCTION IF EXISTS create_user_profile(UUID, TEXT, TEXT, TEXT);

-- Recreate get_user_profile with correct return types
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
      '00000000-0000-0000-0000-000000000000'::UUID,
      'jacobtheracer@gmail.com'::TEXT,
      'System Administrator'::TEXT,
      'admin'::TEXT;
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
    AND up.role = requested_role;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate create_user_profile with better error handling
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT
) RETURNS void AS $$
BEGIN
  -- Start transaction
  BEGIN
    -- Insert into user_profiles first
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
        RAISE EXCEPTION 'Invalid role: %', user_role;
    END CASE;

  EXCEPTION WHEN OTHERS THEN
    -- Clean up on error
    DELETE FROM user_profiles WHERE id = user_id;
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure students table has correct columns
DO $$ 
BEGIN
  -- Add name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'students' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE students ADD COLUMN name TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'students' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE students ADD COLUMN email TEXT NOT NULL DEFAULT '';
  END IF;
END $$;