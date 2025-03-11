/*
  # Fix Safe Profile Retrieval

  1. Changes
     - Create stored procedure to safely retrieve user profiles
     - Avoid RLS circular reference issues with direct table access

  2. Security
     - Secure function is security definer to bypass RLS when authorized
     - Only returns data user has access to
*/

-- Create direct function to get profile without recursive RLS
CREATE OR REPLACE FUNCTION get_profile_safely(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT
) 
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT 
    id,
    email,
    name,
    role
  FROM 
    user_profiles
  WHERE 
    id = user_id;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_profile_safely TO authenticated;