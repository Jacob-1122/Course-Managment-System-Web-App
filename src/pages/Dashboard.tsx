import React from 'react';
import { useAuthStore } from '../store/authStore';
import { AdminDashboard } from '../components/AdminDashboard';
import { StudentDashboard } from '../components/StudentDashboard';
import { InstructorDashboard } from '../components/InstructorDashboard';

export function Dashboard() {
  const { user } = useAuthStore();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      {user?.role === 'admin' ? (
        <AdminDashboard />
      ) : user?.role === 'instructor' ? (
        <InstructorDashboard />
      ) : (
        <StudentDashboard />
      )}
    </div>
  );
}