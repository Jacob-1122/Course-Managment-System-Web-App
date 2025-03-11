import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, LogIn, UserPlus, Mail, Lock, User, Shield, Info } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (isSignUp) {
        await signUp(email, password, role, name);
        toast.success('Account created successfully! Redirecting to dashboard...');
      } else {
        await signIn(email, password, role);
        toast.success('Login successful! Redirecting to dashboard...');
      }
      
      // Navigate based on role
      switch(role) {
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
          navigate('/');
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Error is handled in the store with toast
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to handle demo logins
  const handleDemoLogin = async (demoRole: string) => {
    setIsSubmitting(true);
    
    try {
      let demoEmail, demoPassword;
      
      switch(demoRole) {
        case 'student':
          demoEmail = 'demo.student@example.com';
          demoPassword = 'Demo@123';
          break;
        case 'instructor':
          demoEmail = 'demo.instructor@example.com';
          demoPassword = 'Demo@123';
          break;
        case 'admin':
          demoEmail = 'jacobtheracer@gmail.com';
          demoPassword = 'Admin@123';
          break;
        default:
          throw new Error('Invalid demo role');
      }
      
      toast.loading('Logging in with demo account...', {
        duration: 2000
      });
      
      await signIn(demoEmail, demoPassword, demoRole);
      
      // Navigate based on role
      switch(demoRole) {
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
          navigate('/');
      }
    } catch (err) {
      console.error('Demo login error:', err);
      toast.error('Demo login failed. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show demo credentials
  const renderDemoCredentials = () => {
    if (!showCredentials) return null;
    
    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Account Credentials</h3>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div>
            <p className="font-medium">Student:</p>
            <p>Email: demo.student@example.com</p>
            <p>Password: Demo@123</p>
          </div>
          <div>
            <p className="font-medium">Instructor:</p>
            <p>Email: demo.instructor@example.com</p>
            <p>Password: Demo@123</p>
          </div>
          <div>
            <p className="font-medium">Admin:</p>
            <p>Email: jacobtheracer@gmail.com</p>
            <p>Password: Admin@123</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <GraduationCap className="h-16 w-16 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-indigo-600 hover:text-indigo-500"
              disabled={isSubmitting}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
        
        <div className="mt-8">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {isSignUp && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder={isSignUp ? 'Create password' : 'Password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                {isSignUp && (
                  <p className="mt-2 text-sm text-gray-500">
                    Must contain 8+ characters, uppercase, number, special character
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="role"
                    name="role"
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    {!isSignUp && <option value="admin">Admin</option>}
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      {isSignUp ? (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create Account
                        </>
                      ) : (
                        <>
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign in
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>

            {!isSignUp && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or try a demo account</span>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleDemoLogin('student')}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      disabled={isSubmitting}
                    >
                      Demo Student
                    </button>
                    <button
                      onClick={() => handleDemoLogin('instructor')}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      disabled={isSubmitting}
                    >
                      Demo Instructor
                    </button>
                    <button
                      onClick={() => handleDemoLogin('admin')}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      disabled={isSubmitting}
                    >
                      Demo Admin
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowCredentials(!showCredentials)}
                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    {showCredentials ? 'Hide demo credentials' : 'Show demo credentials'}
                  </button>
                  
                  {renderDemoCredentials()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}