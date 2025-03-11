/*
  # Fix logs table foreign key relationship

  1. Changes
    - Add proper foreign key relationship between logs and auth.users
    - Update logs policy to use correct references

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS logs
  DROP CONSTRAINT IF EXISTS logs_performed_by_fkey;

-- Fix the logs foreign key reference
ALTER TABLE logs 
  ADD CONSTRAINT logs_performed_by_fkey 
  FOREIGN KEY (performed_by) 
  REFERENCES auth.users(id);

-- Update logs policy for proper access
DROP POLICY IF EXISTS "Admins can read all logs" ON logs;
CREATE POLICY "Admins can read all logs"
  ON logs
  FOR SELECT
  TO authenticated
  USING (is_admin_from_metadata());