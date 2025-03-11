import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Users, BookOpen, LogOut, Crown, School, User, Bell, Settings, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function Layout() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return <Crown className="w-5 h-5" />;
      case 'instructor':
        return <School className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  // Role-based navigation items
  const getNavItems = () => {
    const items = [
      {
        to: '/courses',
        icon: <BookOpen className="w-5 h-5 mr-1" />,
        label: 'Courses',
        roles: ['admin', 'instructor', 'student'],
      }
    ];

    // Only admins and instructors can view students
    if (user?.role === 'admin' || user?.role === 'instructor') {
      items.push({
        to: '/students',
        icon: <Users className="w-5 h-5 mr-1" />,
        label: 'Students',
        roles: ['admin', 'instructor'],
      });
    }

    // Only admins see the dashboard (with all management features)
    if (user?.role === 'admin') {
      items.unshift({
        to: '/dashboard',
        icon: <Crown className="w-5 h-5 mr-1" />,
        label: 'Admin Dashboard',
        roles: ['admin'],
      });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {user && (
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link to="/" className="flex items-center px-4 text-gray-900 font-semibold">
                  <GraduationCap className="w-6 h-6 mr-2" />
                  Course Management
                </Link>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navItems.map((item) => (
                    <Link 
                      key={item.to}
                      to={item.to} 
                      className={`flex items-center px-3 ${
                        location.pathname === item.to 
                          ? 'border-b-2 border-indigo-500 text-gray-900' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">
                    Welcome, {user.name || 'User'}
                  </span>
                </div>
                <div className="flex items-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-full">
                  {getRoleIcon()}
                  <span className="ml-2 capitalize">{user.role}</span>
                </div>
                <Link 
                  to="/profile"
                  className="flex items-center px-3 py-2 text-gray-500 hover:text-gray-700"
                >
                  <Settings className="w-5 h-5 mr-1" />
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-3 py-2 text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="w-5 h-5 mr-1" />
                  Sign Out
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="flex items-center sm:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  {mobileMenuOpen ? (
                    <X className="block h-6 w-6" />
                  ) : (
                    <Menu className="block h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
            <div className="pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center px-3 py-2 ${
                    location.pathname === item.to
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    {getRoleIcon()}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.name || 'User'}</div>
                  <div className="text-sm font-medium text-gray-500 capitalize">{user.role}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-5 h-5 mr-1" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  <LogOut className="w-5 h-5 mr-1" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {user && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Logged in as: <span className="text-indigo-600 capitalize">{user.role}</span>
            </h1>
            <p className="text-gray-600">
              {user.role === 'student' && 'You can view and enroll in available courses.'}
              {user.role === 'instructor' && 'You can manage your assigned courses and view enrolled students.'}
              {user.role === 'admin' && 'You have full access to manage courses, instructors, and students.'}
            </p>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}