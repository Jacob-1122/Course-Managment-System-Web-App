import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Trash2, Edit, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Course, Log } from '../types';
import { AddCourseModal } from './AddCourseModal';
import { EditCourseModal } from './EditCourseModal';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export function AdminDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchCourses();
    fetchLogs();
  }, []);

  async function fetchCourses() {
    setIsLoading(true);
    
    try {
      // For demo users, use localStorage to get and manage courses
      if (isDemoUser(user?.id || '')) {
        const demoCourses = getDemoCoursesFromStorage();
        setCourses(demoCourses);
        setIsLoading(false);
        return;
      }
      
      // For real users, use Supabase
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      setIsLoading(false);
      
      if (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
        return;
      }
      
      setCourses(data || []);
    } catch (err) {
      console.error('Error in fetchCourses:', err);
      setIsLoading(false);
      toast.error('Failed to load courses');
    }
  }

  async function fetchLogs() {
    try {
      // Simplified query to avoid relationship issues
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching logs:', error);
        return;
      }
      
      // For demo users, use fake logs with user info
      if (isDemoUser(user?.id || '')) {
        const demoLogs = generateDemoLogs();
        setLogs(demoLogs);
        return;
      }
      
      // Manually get user names for logs where possible
      const logsWithUserInfo = await Promise.all(data.map(async (log) => {
        if (log.performed_by) {
          try {
            const { data: userData, error: userError } = await supabase
              .from('user_profiles')
              .select('name, role')
              .eq('id', log.performed_by)
              .single();
            
            if (!userError && userData) {
              return {
                ...log,
                user_profiles: userData
              };
            }
          } catch (e) {
            console.error('Error fetching user data for log:', e);
          }
        }
        return {
          ...log,
          user_profiles: { name: 'Unknown User', role: 'unknown' }
        };
      }));
      
      setLogs(logsWithUserInfo);
    } catch (err) {
      console.error('Error in fetchLogs:', err);
    }
  }

  async function deleteCourse(courseId: string) {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      // For demo users, remove from localStorage
      if (isDemoUser(user?.id || '')) {
        removeCourseFromDemoStorage(courseId);
        toast.success('Course deleted successfully');
        fetchCourses();
        return;
      }
      
      // For real users, use Supabase
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) {
        console.error('Error deleting course:', error);
        toast.error('Failed to delete course: ' + error.message);
        return;
      }

      // Log the action
      await supabase
        .from('logs')
        .insert([{
          action: 'course_deleted',
          performed_by: (await supabase.auth.getUser()).data.user?.id,
          details: { course_id: courseId },
        }]);

      toast.success('Course deleted successfully');
      fetchCourses();
      fetchLogs();
    } catch (err: any) {
      console.error('Unexpected error deleting course:', err);
      toast.error('Failed to delete course: ' + (err.message || 'Unknown error'));
    }
  }

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsEditModalOpen(true);
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.code && course.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    course.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.instructor && course.instructor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportToCSV = () => {
    const headers = ['Course Name', 'Code', 'Department', 'Instructor', 'Capacity', 'Enrollment', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...courses.map(course => [
        course.name,
        course.code,
        course.department,
        course.instructor,
        course.max_capacity,
        course.current_enrollment,
        new Date(course.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'courses.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionDescription = (log: Log) => {
    const details = log.details as any;
    
    switch (log.action) {
      case 'course_created':
        return `Created course "${details?.course_name || 'Unknown'}"`;
      case 'course_updated':
        return `Updated course "${details?.previous_name || 'Unknown'}" to "${details?.new_name || 'Unknown'}"`;
      case 'course_deleted':
        return `Deleted course with ID ${details?.course_id || 'Unknown'}`;
      default:
        return log.action || 'Unknown action';
    }
  };
  
  // Helper functions for demo users
  function isDemoUser(userId: string) {
    return userId === '11111111-2222-3333-4444-555555555555' || // admin
           userId === '12345678-1234-1234-1234-123456789012' || // student
           userId === '87654321-4321-4321-4321-210987654321';   // instructor
  }
  
  function getDemoCoursesFromStorage() {
    try {
      // Get existing courses or initialize with some demo data if empty
      let courses = JSON.parse(localStorage.getItem('demoCourses') || '[]');
      
      if (courses.length === 0) {
        // Add some demo courses for first-time demo users
        courses = [
          {
            id: 'course-1',
            name: 'Introduction to Programming',
            code: 'CS101',
            department: 'Computer Science',
            instructor: 'Demo Instructor',
            instructor_id: '87654321-4321-4321-4321-210987654321',
            max_capacity: 30,
            current_enrollment: 15,
            created_at: new Date().toISOString()
          },
          {
            id: 'course-2',
            name: 'Data Structures and Algorithms',
            code: 'CS201',
            department: 'Computer Science',
            instructor: 'Demo Instructor',
            instructor_id: '87654321-4321-4321-4321-210987654321',
            max_capacity: 25,
            current_enrollment: 18,
            created_at: new Date().toISOString()
          }
        ];
        localStorage.setItem('demoCourses', JSON.stringify(courses));
      }
      
      return courses;
    } catch (err) {
      console.error('Error getting demo courses:', err);
      return [];
    }
  }
  
  function removeCourseFromDemoStorage(courseId: string) {
    try {
      const courses = JSON.parse(localStorage.getItem('demoCourses') || '[]');
      const updatedCourses = courses.filter((c: any) => c.id !== courseId);
      localStorage.setItem('demoCourses', JSON.stringify(updatedCourses));
      
      // Also add to demo logs
      addDemoLog({
        id: 'log-' + new Date().getTime(),
        action: 'course_deleted',
        performed_by: user?.id || '',
        details: { course_id: courseId },
        created_at: new Date().toISOString(),
        user_profiles: { name: user?.name || 'Demo Admin', role: 'admin' }
      });
    } catch (err) {
      console.error('Error removing course from localStorage:', err);
    }
  }
  
  function generateDemoLogs() {
    const storedLogs = JSON.parse(localStorage.getItem('demoLogs') || '[]');
    
    // If we have stored logs, return those
    if (storedLogs.length > 0) {
      return storedLogs;
    }
    
    // Otherwise generate some fake logs
    const demoLogs = [
      {
        id: 'log-1',
        action: 'course_created',
        performed_by: '11111111-2222-3333-4444-555555555555',
        details: { course_name: 'Introduction to Programming', course_id: 'course-1' },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        user_profiles: { name: 'Demo Admin', role: 'admin' }
      },
      {
        id: 'log-2',
        action: 'course_created',
        performed_by: '87654321-4321-4321-4321-210987654321',
        details: { course_name: 'Data Structures and Algorithms', course_id: 'course-2' },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
        user_profiles: { name: 'Demo Instructor', role: 'instructor' }
      }
    ];
    
    // Save to localStorage
    localStorage.setItem('demoLogs', JSON.stringify(demoLogs));
    
    return demoLogs;
  }
  
  function addDemoLog(log: any) {
    try {
      const logs = JSON.parse(localStorage.getItem('demoLogs') || '[]');
      logs.unshift(log); // Add to beginning
      localStorage.setItem('demoLogs', JSON.stringify(logs.slice(0, 20))); // Keep only 20 most recent
    } catch (err) {
      console.error('Error adding demo log:', err);
    }
  }

  return (
    <div className="space-y-8">
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
        <div className="space-x-4">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Course Management</h2>
            </div>
            {isLoading ? (
              <div className="px-6 py-4 text-center">Loading courses...</div>
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
                      Instructor
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
                  {filteredCourses.map(course => (
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
                        <div className="text-sm text-gray-900">{course.instructor}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {course.current_enrollment} / {course.max_capacity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCourse(course)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => deleteCourse(course.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-4 text-center text-gray-500">
                No courses found matching your search.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6 space-y-4">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getActionDescription(log)}
                      </p>
                      <p className="text-xs text-gray-500">
                        By {(log as any).user_profiles?.name || 'Unknown user'} ({(log as any).user_profiles?.role || 'unknown role'})
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No recent activity.</p>
            )}
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <AddCourseModal
          onClose={() => setIsAddModalOpen(false)}
          onCourseAdded={() => {
            fetchCourses();
            fetchLogs();
          }}
        />
      )}

      {isEditModalOpen && selectedCourse && (
        <EditCourseModal
          course={selectedCourse}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCourse(null);
          }}
          onCourseUpdated={() => {
            fetchCourses();
            fetchLogs();
          }}
        />
      )}
    </div>
  );
}