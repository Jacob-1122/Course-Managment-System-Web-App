import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { StudentsTab } from './components/StudentsTab';
import { CoursesTab } from './components/CoursesTab';
import { ProfileSettings } from './components/ProfileSettings';
import { useAuthStore } from './store/authStore';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

// Role-specific route components
function RoleBasedRedirect() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Don't redirect if no user or still loading
    if (!user) return;
    
    // Redirect based on role
    switch(user.role) {
      case 'student':
        navigate('/courses');
        break;
      case 'instructor':
        navigate('/courses');
        break;
      case 'admin':
        navigate('/dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  }, [user, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Redirecting...</h2>
        <p className="text-gray-600">Please wait while we load your dashboard.</p>
      </div>
    </div>
  );
}

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<RoleBasedRedirect />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="courses" element={<CoursesTab />} />
          <Route path="students" element={<StudentsTab />} />
          <Route path="profile" element={<ProfileSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;