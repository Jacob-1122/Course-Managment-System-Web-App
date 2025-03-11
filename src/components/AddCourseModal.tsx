import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface Instructor {
  id: string;
  name: string;
  department: string;
}

interface AddCourseModalProps {
  onClose: () => void;
  onCourseAdded: () => void;
}

export function AddCourseModal({ onClose, onCourseAdded }: AddCourseModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [department, setDepartment] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(50);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role === 'instructor') {
      setSelectedInstructorId(user.id);
    } else {
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
        setSelectedInstructorId(data[0].id);
      } else {
        toast.error('No instructors available. Please add instructors first.');
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
      toast.error('You must be logged in to add a course');
      return;
    }

    // For instructors, always use their own ID
    const instructorId = user.role === 'instructor' ? user.id : selectedInstructorId;
    
    if (!instructorId) {
      toast.error('Please select an instructor');
      return;
    }

    // Get instructor name for display
    let instructorName = user.name || 'Unknown Instructor';
    
    if (user.role === 'admin') {
      const selectedInstructor = instructors.find(i => i.id === instructorId);
      instructorName = selectedInstructor?.name || 'Unknown Instructor';
    }

    setIsLoading(true);
    
    try {
      // For demo users (especially admin), we'll create courses with our own custom approach
      if (isDemoUser(user.id)) {
        // Create an initial dummy course to simulate successful creation
        const dummyCourse = {
          id: generateUUID(),
          name,
          code,
          department,
          instructor_id: instructorId,
          instructor: instructorName,
          max_capacity: maxCapacity,
          current_enrollment: 0,
          created_at: new Date().toISOString()
        };
        
        // Store in local storage for persistence
        saveCourseToDemoStorage(dummyCourse);
        
        setTimeout(() => {
          setIsLoading(false);
          toast.success('Course added successfully');
          onCourseAdded();
          onClose();
        }, 800); // Simulate network delay
        
        return;
      }
      
      // For real users, continue with normal operation
      const { data: course, error } = await supabase
        .from('courses')
        .insert([
          { 
            name, 
            code, 
            department, 
            instructor_id: instructorId,
            instructor: instructorName,
            max_capacity: maxCapacity,
            current_enrollment: 0
          }
        ])
        .select()
        .single();

      setIsLoading(false);

      if (error) {
        console.error('Error adding course:', error);
        toast.error('Error adding course: ' + error.message);
        return;
      }

      // Log the action
      await supabase
        .from('logs')
        .insert([{
          action: 'course_created',
          performed_by: user.id,
          details: { course_id: course.id, course_name: name, instructor_id: instructorId },
        }]);

      toast.success('Course added successfully');
      onCourseAdded();
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      console.error('Unexpected error adding course:', err);
      toast.error('Failed to add course: ' + (err.message || 'Unknown error'));
    }
  }
  
  // Helper functions for demo users
  function isDemoUser(userId: string) {
    return userId === '11111111-2222-3333-4444-555555555555' || // admin
           userId === '12345678-1234-1234-1234-123456789012' || // student
           userId === '87654321-4321-4321-4321-210987654321';   // instructor
  }
  
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  function saveCourseToDemoStorage(course: any) {
    try {
      // Get existing courses array or initialize new one
      const existingCourses = JSON.parse(localStorage.getItem('demoCourses') || '[]');
      existingCourses.push(course);
      localStorage.setItem('demoCourses', JSON.stringify(existingCourses));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Course</h2>
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
              placeholder="e.g., Introduction to Programming"
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
              placeholder="e.g., CS101"
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
              placeholder="e.g., Computer Science"
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
                disabled={isLoading}
              >
                {instructors.length === 0 ? (
                  <option value="">Loading instructors...</option>
                ) : (
                  instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name} ({instructor.department})
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
              {isLoading ? 'Adding...' : 'Add Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}