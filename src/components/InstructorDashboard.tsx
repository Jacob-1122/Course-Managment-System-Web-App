import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Users, Book } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Course, Student, Enrollment } from '../types';
import { AddCourseModal } from './AddCourseModal';
import { EditCourseModal } from './EditCourseModal';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function InstructorDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isViewingStudents, setIsViewingStudents] = useState(false);
  const [courseStudents, setCourseStudents] = useState<Student[]>([]);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchInstructorCourses();
      fetchAllEnrollments();
    }
  }, [user]);

  async function fetchInstructorCourses() {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false });
    
    setIsLoading(false);
    
    if (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
      return;
    }
    
    setCourses(data);
  }

  async function fetchAllEnrollments() {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        students (*)
      `);
    
    if (error) {
      console.error('Error fetching enrollments:', error);
      return;
    }
    
    setEnrollments(data);
  }

  async function viewCourseStudents(courseId: string) {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        students (*)
      `)
      .eq('course_id', courseId);
    
    setIsLoading(false);
    
    if (error) {
      console.error('Error fetching course students:', error);
      toast.error('Failed to load enrolled students');
      return;
    }
    
    const students = data.map(enrollment => enrollment.students as Student);
    setCourseStudents(students);
    setCurrentCourseId(courseId);
    setIsViewingStudents(true);
  }

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsEditModalOpen(true);
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentCourseName = currentCourseId 
    ? courses.find(c => c.id === currentCourseId)?.name 
    : '';

  return (
    <div className="space-y-8">
      {isViewingStudents ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Students Enrolled in: {currentCourseName}
            </h2>
            <button
              onClick={() => setIsViewingStudents(false)}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-md hover:bg-indigo-50"
            >
              Back to Courses
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading enrolled students...</div>
          ) : courseStudents.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Academic Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courseStudents.map(student => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{student.academic_status || 'active'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No students enrolled in this course.
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search courses..."
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="text-center py-8">Loading your courses...</div>
            ) : filteredCourses.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCourses.map(course => {
                    const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
                    return (
                      <tr key={course.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{course.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{course.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{course.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {courseEnrollments.length} / {course.max_capacity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleEditCourse(course)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit course"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => viewCourseStudents(course.id)}
                              className="text-green-600 hover:text-green-900"
                              title="View enrolled students"
                            >
                              <Users className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-4 text-center text-gray-500">
                You don't have any courses yet. Click "Add Course" to create one.
              </div>
            )}
          </div>
        </>
      )}

      {isAddModalOpen && (
        <AddCourseModal
          onClose={() => setIsAddModalOpen(false)}
          onCourseAdded={fetchInstructorCourses}
        />
      )}

      {isEditModalOpen && selectedCourse && (
        <EditCourseModal
          course={selectedCourse}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCourse(null);
          }}
          onCourseUpdated={fetchInstructorCourses}
        />
      )}
    </div>
  );
}