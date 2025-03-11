import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { User, Crown, School, Pencil, Save, XCircle } from 'lucide-react';

export function ProfileSettings() {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Additional fields depending on role
  const [department, setDepartment] = useState('');
  const [title, setTitle] = useState('');
  
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      
      // If user is an instructor, fetch additional details
      if (user.role === 'instructor') {
        fetchInstructorDetails();
      }
    }
  }, [user]);
  
  async function fetchInstructorDetails() {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('instructors')
      .select('department, title')
      .eq('id', user.id)
      .single();
    
    setIsLoading(false);
    
    if (error) {
      console.error('Error fetching instructor details:', error);
      return;
    }
    
    if (data) {
      setDepartment(data.department || '');
      setTitle(data.title || '');
    }
  }
  
  async function handleSaveProfile() {
    if (!user) return;
    
    setIsLoading(true);
    
    // Update user_profiles table
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ name })
      .eq('id', user.id);
    
    if (profileError) {
      console.error('Error updating profile:', profileError);
      toast.error('Failed to update profile');
      setIsLoading(false);
      return;
    }
    
    // If user is an instructor, update instructor-specific details
    if (user.role === 'instructor') {
      const { error: instructorError } = await supabase
        .from('instructors')
        .update({ 
          name,
          department,
          title 
        })
        .eq('id', user.id);
      
      if (instructorError) {
        console.error('Error updating instructor details:', instructorError);
        toast.error('Failed to update instructor details');
        setIsLoading(false);
        return;
      }
    }
    
    // If user is a student, update student details
    if (user.role === 'student') {
      const { error: studentError } = await supabase
        .from('students')
        .update({ name })
        .eq('id', user.id);
      
      if (studentError) {
        console.error('Error updating student details:', studentError);
        toast.error('Failed to update student details');
        setIsLoading(false);
        return;
      }
    }
    
    setIsLoading(false);
    setIsEditing(false);
    toast.success('Profile updated successfully');
    
    // Refresh user data in auth store
    await supabase.auth.refreshSession();
  }
  
  function getRoleIcon() {
    switch (user?.role) {
      case 'admin':
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 'instructor':
        return <School className="w-6 h-6 text-blue-500" />;
      default:
        return <User className="w-6 h-6 text-green-500" />;
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">You need to be logged in to view this page.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-indigo-600 px-6 py-4">
        <h1 className="text-white text-xl font-semibold">Profile Settings</h1>
      </div>
      
      <div className="p-6">
        <div className="flex items-center mb-6">
          <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
            {getRoleIcon()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{name}</h2>
            <div className="flex items-center mt-1">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium capitalize">
                {user.role}
              </span>
              <span className="ml-2 text-gray-500">{email}</span>
            </div>
          </div>
          
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="ml-auto flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(false)}
              className="ml-auto flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </button>
          )}
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                className={`mt-1 block w-full rounded-md ${
                  isEditing ? 'border-gray-300' : 'border-transparent bg-gray-100'
                } shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                className="mt-1 block w-full rounded-md border-transparent bg-gray-100 shadow-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Email address cannot be changed.</p>
            </div>
            
            {user.role === 'instructor' && (
              <>
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={!isEditing}
                    className={`mt-1 block w-full rounded-md ${
                      isEditing ? 'border-gray-300' : 'border-transparent bg-gray-100'
                    } shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                  />
                </div>
                
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., Professor, Assistant Professor"
                    className={`mt-1 block w-full rounded-md ${
                      isEditing ? 'border-gray-300' : 'border-transparent bg-gray-100'
                    } shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
                  />
                </div>
              </>
            )}
          </div>
          
          {isEditing && (
            <div className="mt-6">
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="mr-4">
                {getRoleIcon()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Account Type: <span className="capitalize">{user.role}</span></p>
                <p className="text-sm text-gray-500">
                  {user.role === 'student' && 'Student accounts can enroll in courses and access learning materials.'}
                  {user.role === 'instructor' && 'Instructor accounts can manage courses, view student enrollments, and upload course materials.'}
                  {user.role === 'admin' && 'Administrator accounts have full access to manage all courses, instructors, and students.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}