/*
  # Initial Schema Setup for Course Management System

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `name` (text)
      - `faculty` (text)
      - `instructor` (text)
      - `created_at` (timestamp)
    
    - `students`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `created_at` (timestamp)
    
    - `enrollments`
      - `id` (uuid, primary key)
      - `course_id` (uuid, foreign key)
      - `student_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  faculty text NOT NULL,
  instructor text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Policies for courses
CREATE POLICY "Allow read access for authenticated users"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated users"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
  ON courses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users"
  ON courses FOR DELETE
  TO authenticated
  USING (true);

-- Policies for students
CREATE POLICY "Allow read access for authenticated users"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated users"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users"
  ON students FOR DELETE
  TO authenticated
  USING (true);

-- Policies for enrollments
CREATE POLICY "Allow read access for authenticated users"
  ON enrollments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated users"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users"
  ON enrollments FOR DELETE
  TO authenticated
  USING (true);