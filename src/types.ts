export interface Course {
  id: string;
  name: string;
  code: string;
  department: string;
  instructor: string;
  instructor_id: string;
  max_capacity: number;
  current_enrollment: number;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  profile_url?: string;
  academic_status?: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_id: string;
  status: 'enrolled' | 'waitlisted' | 'completed';
  enrollment_status: 'pending' | 'enrolled' | 'waitlisted' | 'completed' | 'dropped';
  enrollment_date: string;
  last_accessed: string;
  created_at: string;
  courses?: Course;
  students?: Student;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'student' | 'instructor';
  name?: string;
  profile_url?: string;
}

export interface Log {
  id: string;
  action: string;
  performed_by: string;
  details: any;
  created_at: string;
}

export interface Instructor {
  id: string;
  name: string;
  department: string;
  title?: string;
  specialization?: string[];
  office_hours?: any;
  contact_info?: any;
  created_at: string;
}