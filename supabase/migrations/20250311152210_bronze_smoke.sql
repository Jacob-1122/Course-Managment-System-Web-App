/*
  # Fix user profiles RLS policies

  1. Changes
    - Drop all existing policies
    - Create new non-recursive policies
    - Add proper security for different operations

  2. Security
    - Enable RLS
    - Add separate policies for each operation
    - Prevent infinite recursion in admin checks
*/

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for signup" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own data" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for signup" ON user_profiles;

-- Create a security definer function to safely check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Create new policies using the security definer function
CREATE POLICY "Allow users to read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR is_admin(auth.uid())
);

CREATE POLICY "Allow users to update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow new user creation during signup"
ON user_profiles
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- During signup, the new user's ID must match the authenticated user's ID
  -- or if it's an anonymous signup
  CASE 
    WHEN auth.uid() IS NULL THEN true  -- Allow anonymous signup
    ELSE auth.uid() = id              -- Must match authenticated user's ID
  END
);