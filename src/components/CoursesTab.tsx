import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { StudentDashboard } from './StudentDashboard';
import { InstructorDashboard } from './InstructorDashboard';
import { AdminDashboard } from './AdminDashboard';

export function CoursesTab() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-indigo-500 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading courses...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">You need to be logged in to view this page.</p>
      </div>
    );
  }

  // Render the appropriate dashboard based on user role
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Courses</h1>
      
      {user.role === 'student' && <StudentDashboard />}
      {user.role === 'instructor' && <InstructorDashboard />}
      {user.role === 'admin' && <AdminDashboard />}
    </div>
  );
}