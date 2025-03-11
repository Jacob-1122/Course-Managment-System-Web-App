/*
  # Role-Based User Management System

  1. New Tables
    - `admins`: Administrative users with full system access
    - `instructors`: Course instructors/teachers
    - `students`: Student users with academic status tracking
    - Enhanced `user_profiles` with role-specific foreign keys

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Create helper functions for role checks

  3. Changes
    - Add role-specific profile tables
    - Add relationships between tables
    - Improve security model
*/

-- Helper Functions
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

CREATE OR REPLACE FUNCTION is_instructor(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = user_id AND role = 'instructor'
  );
END;
$$;

-- Create type for academic status
DO $$ BEGIN
  CREATE TYPE academic_status_type AS ENUM ('active', 'inactive', 'graduated', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  security_level text NOT NULL DEFAULT 'standard',
  can_manage_instructors boolean DEFAULT false,
  can_manage_courses boolean DEFAULT true,
  last_security_update timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin records"
  ON admins
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can update admin records"
  ON admins
  FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.uid()) AND 
    EXISTS (
      SELECT 1 FROM admins 
      WHERE id = auth.uid() AND security_level = 'super'
    )
  );

-- Create Instructors Table
CREATE TABLE IF NOT EXISTS instructors (
  id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  department text NOT NULL,
  title text,
  specialization text[],
  office_hours jsonb,
  contact_info jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own record"
  ON instructors
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR 
    is_admin(auth.uid())
  );

CREATE POLICY "Instructors can update own record"
  ON instructors
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create Students Table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  student_id text UNIQUE,
  major text,
  enrollment_date date DEFAULT CURRENT_DATE,
  graduation_year integer,
  created_at timestamptz DEFAULT now()
);

-- Add status column after table creation to handle the ENUM type properly
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS academic_status academic_status_type DEFAULT 'active'::academic_status_type;

-- Add academic advisor after both tables exist
ALTER TABLE students
ADD COLUMN IF NOT EXISTS academic_advisor uuid REFERENCES instructors(id);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own record"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR 
    is_admin(auth.uid()) OR 
    is_instructor(auth.uid())
  );

CREATE POLICY "Students can update own record"
  ON students
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_advisor ON students(academic_advisor);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(academic_status);
CREATE INDEX IF NOT EXISTS idx_instructors_department ON instructors(department);

-- Update courses table to reference instructor profiles
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS instructor_id uuid REFERENCES instructors(id),
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS prerequisites uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS syllabus jsonb,
ADD COLUMN IF NOT EXISTS schedule jsonb;

-- Create course materials table
CREATE TABLE IF NOT EXISTS course_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content_type text NOT NULL,
  content jsonb NOT NULL,
  created_by uuid REFERENCES instructors(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course materials are viewable by enrolled students and instructors"
  ON course_materials
  FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid()) OR
    is_instructor(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM enrollments 
      WHERE student_id = auth.uid() 
      AND course_id = course_materials.course_id
    )
  );

-- Create student progress tracking
CREATE TABLE IF NOT EXISTS student_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  progress jsonb DEFAULT '{"completed": 0, "total": 100}'::jsonb,
  grades jsonb DEFAULT '{}'::jsonb,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);

ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own progress"
  ON student_progress
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR 
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM courses 
      WHERE id = student_progress.course_id 
      AND instructor_id = auth.uid()
    )
  );

-- Update enrollments table with additional fields
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS enrollment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS enrollment_date timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_accessed timestamptz DEFAULT now(),
ADD CONSTRAINT valid_enrollment_status 
  CHECK (enrollment_status IN ('pending', 'enrolled', 'waitlisted', 'completed', 'dropped'));

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_notification_type 
    CHECK (type IN ('course_update', 'enrollment', 'grade', 'announcement', 'system'))
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());