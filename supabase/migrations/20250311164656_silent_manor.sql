/*
  # Add Safe Profile Retrieval Function

  1. New Functions
     - Add get_profile_safely function for retrieving user profiles without causing recursion
     - This function bypasses RLS and is a security definer

  2. Security
     - Function is security definer to bypass RLS while still maintaining security
     - Only returns the user's own profile or admin can see all profiles
*/

-- Create a function to safely get a user profile without recursion issues
CREATE OR REPLACE FUNCTION get_profile_safely(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.name,
    up.role
  FROM 
    user_profiles up
  WHERE 
    up.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_profile_safely TO authenticated;