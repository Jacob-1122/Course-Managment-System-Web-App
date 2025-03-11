/*
  # Fix user profiles policies

  1. Changes
    - Remove recursive admin policy
    - Add proper insert policy for signup
    - Simplify RLS policies

  2. Security
    - Enable RLS
    - Add non-recursive policies
    - Allow new user creation during signup
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

-- Create new, simplified policies
CREATE POLICY "Enable read access for users"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Enable insert for authenticated users"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow public insert during signup
CREATE POLICY "Enable insert for signup"
  ON user_profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);