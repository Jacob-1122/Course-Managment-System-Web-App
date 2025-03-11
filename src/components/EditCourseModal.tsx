import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Course } from '../types';

interface Instructor {
  id: string;
  name: string;
  department: string;
}

interface EditCourseModalProps {
  course: Course;
  onClose: () => void;
  onCourseUpdated: () => void;
}

export function EditCourseModal({ course, onClose, onCourseUpdated }: EditCourseModalProps) {
  const [name, setName] = useState(course.name);
  const [code, setCode] = useState(course.code || '');
  const [department, setDepartment] = useState(course.department);
  const [maxCapacity, setMaxCapacity] = useState(course.max_capacity || 50);
  const [selectedInstructorId, setSelectedInstructorId] = useState(course.instructor_id || '');
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchInstructors();
    }
  }, [user]);

  async function fetchInstructors() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('instructors')
        .select('id, name, department');
      
      setIsLoading(false);
      
      if (error) {
        console.error('Error fetching instructors:', error);
        toast.error('Failed to load instructors');
        return;
      }
      
      if (data && data.length > 0) {
        setInstructors(data);
        if (!selectedInstructorId && data.length > 0) {
          setSelectedInstructorId(data[0].id);
        }
      } else {
        // If no instructors, populate with demo instructors for admin
        if (isDemoUser(user?.id || '')) {
          setInstructors([
            {
              id: '87654321-4321-4321-4321-210987654321',
              name: 'Demo Instructor',
              department: 'Computer Science'
            },
            {
              id: 'instructor-2',
              name: 'Jane Smith',
              department: 'Mathematics'
            },
            {
              id: 'instructor-3',
              name: 'Bob Johnson',
              department: 'Physics'
            }
          ]);
        } else {
          toast.error('No instructors available');
        }
      }
    } catch (err) {
      console.error('Error in fetchInstructors:', err);
      setIsLoading(false);
      toast.error('Failed to load instructors');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to update a course');
      return;
    }

    // For instructors, they can't change the instructor
    const instructorId = user.role === 'instructor' ? course.instructor_id : selectedInstructorId;
    
    if (!instructorId) {
      toast.error('Please select an instructor');
      return;
    }

    // Get instructor name for display if it's being changed
    let instructorName = course.instructor;
    
    if (user.role === 'admin' && instructorId !== course.instructor_id) {
      const selectedInstructor = instructors.find(i => i.id === instructorId);
      instructorName = selectedInstructor?.name || 'Unknown Instructor';
    }

    setIsLoading(true);
    
    try {
      // For demo users, use localStorage
      if (isDemoUser(user.id)) {
        // Update the course in localStorage
        updateCourseInDemoStorage(course.id, {
          name,
          code,
          department,
          instructor_id: instructorId,
          instructor: instructorName,
          max_capacity: maxCapacity
        });
        
        // Simulate network delay
        setTimeout(() => {
          setIsLoading(false);
          toast.success('Course updated successfully');
          onCourseUpdated();
          onClose();
        }, 800);
        
        return;
      }
      
      // For real users, use Supabase
      const { data: updatedCourse, error } = await supabase
        .from('courses')
        .update({ 
          name, 
          code, 
          department, 
          instructor_id: instructorId,
          instructor: instructorName,
          max_capacity: maxCapacity
        })
        .eq('id', course.id)
        .select()
        .single();

      setIsLoading(false);

      if (error) {
        console.error('Error updating course:', error);
        toast.error('Error updating course: ' + error.message);
        return;
      }

      // Log the action
      await supabase
        .from('logs')
        .insert([{
          action: 'course_updated',
          performed_by: user.id,
          details: { 
            course_id: course.id, 
            previous_name: course.name,
            new_name: name,
            instructor_changed: instructorId !== course.instructor_id
          },
        }]);

      toast.success('Course updated successfully');
      onCourseUpdated();
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      console.error('Unexpected error updating course:', err);
      toast.error('Failed to update course: ' + (err.message || 'Unknown error'));
    }
  }
  
  // Helper functions for demo users
  function isDemoUser(userId: string) {
    return userId === '11111111-2222-3333-4444-555555555555' || // admin
           userId === '12345678-1234-1234-1234-123456789012' || // student
           userId === '87654321-4321-4321-4321-210987654321';   // instructor
  }
  
  function updateCourseInDemoStorage(courseId: string, updates: any) {
    try {
      // Get existing courses
      const existingCourses = JSON.parse(localStorage.getItem('demoCourses') || '[]');
      
      // Find and update the course
      const updatedCourses = existingCourses.map((c: any) => 
        c.id === courseId ? { ...c, ...updates } : c
      );
      
      // Save back to localStorage
      localStorage.setItem('demoCourses', JSON.stringify(updatedCourses));
    } catch (err) {
      console.error('Error updating course in localStorage:', err);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Course</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Course Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Course Code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <input
              type="text"
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          {user?.role === 'admin' && (
            <div>
              <label htmlFor="instructor" className="block text-sm font-medium text-gray-700">
                Instructor
              </label>
              <select
                id="instructor"
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                {instructors.length === 0 ? (
                  <option value={course.instructor_id || ''}>
                    {course.instructor || 'Unknown'} (Current)
                  </option>
                ) : (
                  instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name} ({instructor.department})
                      {instructor.id === course.instructor_id ? ' (Current)' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="maxCapacity" className="block text-sm font-medium text-gray-700">
              Maximum Capacity
            </label>
            <input
              type="number"
              id="maxCapacity"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              min="1"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}