/*
  # User Management Functions and Triggers

  1. Functions
    - create_user_profile: Creates user profile and role-specific records
    - handle_auth_user_created: Trigger function to handle new auth users
    - get_user_role: Helper function to get user role
    
  2. Triggers
    - Create trigger on auth.users table
    
  3. Security
    - All functions are SECURITY DEFINER for proper access
*/

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM user_profiles 
    WHERE id = user_id
  );
END;
$$;

-- Function to create user profile and role-specific records
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into user_profiles
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
    WHEN 'admin' THEN
      INSERT INTO admins (id, security_level)
      VALUES (user_id, 'standard');
  END CASE;
END;
$$;

-- Trigger function to handle new auth users
CREATE OR REPLACE FUNCTION handle_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create user profile and role-specific records
  PERFORM create_user_profile(
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_created();