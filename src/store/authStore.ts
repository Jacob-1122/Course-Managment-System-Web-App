import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { loginSchema, signupSchema } from '../lib/validation';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, role: string, name: string) => Promise<void>;
  signIn: (email: string, password: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

// Hardcoded demo accounts - these bypass the database completely
const DEMO_ACCOUNTS = {
  student: {
    id: '12345678-1234-1234-1234-123456789012',
    email: 'demo.student@example.com',
    password: 'Demo@123',
    name: 'Demo Student',
    role: 'student'
  },
  instructor: {
    id: '87654321-4321-4321-4321-210987654321',
    email: 'demo.instructor@example.com',
    password: 'Demo@123',
    name: 'Demo Instructor',
    role: 'instructor'
  },
  admin: {
    id: '11111111-2222-3333-4444-555555555555',
    email: 'jacobtheracer@gmail.com',
    password: 'Admin@123',
    name: 'Demo Admin',
    role: 'admin'
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  
  updateUser: (updates: Partial<User>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null
    }));
  },
  
  signUp: async (email: string, password: string, role: string, name: string) => {
    try {
      // Prevent admin signup
      if (role === 'admin') {
        toast.error('Admin accounts cannot be created through signup');
        throw new Error('Admin signup not allowed');
      }

      // Check if this is trying to sign up with a demo account
      if (
        email === DEMO_ACCOUNTS.student.email || 
        email === DEMO_ACCOUNTS.instructor.email || 
        email === DEMO_ACCOUNTS.admin.email
      ) {
        toast.error('This email is reserved for demo purposes. Please use a different email.');
        throw new Error('Demo email cannot be used for signup');
      }

      // Validate input data
      const validatedData = signupSchema.parse({ email, password, role, name });
      
      // For regular signups, just use Supabase Auth
      toast.loading('Creating your account...', { id: 'signup-loading' });
      
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            role: validatedData.role,
            name: validatedData.name,
          }
        }
      });

      toast.dismiss('signup-loading');

      if (authError) {
        console.error('Auth signup error:', authError);
        if (authError.status === 422) {
          toast.error('User already exists. Please sign in instead.');
        } else {
          toast.error(`Error creating account: ${authError.message || 'Unknown error'}`);
        }
        throw authError;
      }

      if (!authData.user) {
        toast.error('No user data returned from signup');
        throw new Error('No user data returned');
      }

      // Set the user in the store
      const newUser = { 
        id: authData.user.id, 
        email: authData.user.email!, 
        role: validatedData.role,
        name: validatedData.name,
      };
      
      set({ user: newUser });
      toast.success('Account created successfully');
      
      return;
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.message && !toast.isActive('signup-error')) {
        toast.error(err.message, { id: 'signup-error' });
      } else if (!toast.isActive('signup-error')) {
        toast.error('Failed to create account', { id: 'signup-error' });
      }
      throw err;
    }
  },
  
  signIn: async (email: string, password: string, role: string) => {
    try {
      // Check for demo account logins - case insensitive email matching
      const isDemoStudent = email.toLowerCase() === DEMO_ACCOUNTS.student.email.toLowerCase() && role === 'student';
      const isDemoInstructor = email.toLowerCase() === DEMO_ACCOUNTS.instructor.email.toLowerCase() && role === 'instructor'; 
      const isDemoAdmin = email.toLowerCase() === DEMO_ACCOUNTS.admin.email.toLowerCase() && role === 'admin';
      
      const isDemoAccount = isDemoStudent || isDemoInstructor || isDemoAdmin;
      
      // Handle demo account login
      if (isDemoAccount) {
        let demoAccount;
        
        if (isDemoStudent) demoAccount = DEMO_ACCOUNTS.student;
        else if (isDemoInstructor) demoAccount = DEMO_ACCOUNTS.instructor;
        else if (isDemoAdmin) demoAccount = DEMO_ACCOUNTS.admin;
        else {
          toast.error('Invalid demo account');
          throw new Error('Invalid demo account');
        }
        
        // For demo accounts, we'll be more lenient with passwords
        // If they use the exact email for a demo account, we'll let them in with any password
        // This makes it easier for users trying the demo
        
        // Create the demo user object
        const demoUser = {
          id: demoAccount.id,
          email: demoAccount.email,
          role: demoAccount.role as 'admin' | 'student' | 'instructor',
          name: demoAccount.name
        };
        
        // Store in localStorage to persist across page refreshes
        localStorage.setItem('demoUser', JSON.stringify(demoUser));
        
        // Set in state
        set({ user: demoUser });
        toast.success(`Logged in as demo ${role}`);
        return;
      }
      
      // For non-demo accounts, validate the input
      const validatedData = loginSchema.parse({ email, password, role });
      
      // Regular login with Supabase
      toast.loading('Signing in...', { id: 'signin-loading' });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password
      });
      
      toast.dismiss('signin-loading');
      
      if (error) {
        console.error('Sign in error:', error);
        toast.error('Invalid email or password');
        throw error;
      }
      
      if (!data.user) {
        toast.error('No user data returned');
        throw new Error('No user data returned');
      }
      
      // Get user metadata
      const userRole = data.user.user_metadata?.role || 'student';
      const userName = data.user.user_metadata?.name || email.split('@')[0];
      
      // Verify role matches what was selected
      if (userRole !== role) {
        toast.error(`This account is a ${userRole}, not a ${role}`);
        await supabase.auth.signOut();
        throw new Error('Role mismatch');
      }
      
      // Set in state
      set({ 
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: userRole,
          name: userName
        }
      });
      
      toast.success('Logged in successfully');
    } catch (err: any) {
      console.error('Login error:', err);
      if (!toast.isActive('login-error')) {
        toast.error(err.message || 'Login failed', { id: 'login-error' });
      }
      throw err;
    }
  },
  
  signOut: async () => {
    try {
      // Clear any demo user from localStorage
      localStorage.removeItem('demoUser');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast.error('Error signing out');
        throw error;
      }
      
      set({ user: null });
      toast.success('Signed out successfully');
    } catch (err) {
      console.error('Sign out error:', err);
      toast.error('Failed to sign out');
      throw err;
    }
  },
  
  checkAuth: async () => {
    try {
      set({ loading: true });
      
      // First check for demo user in localStorage
      const storedDemoUser = localStorage.getItem('demoUser');
      if (storedDemoUser) {
        try {
          const demoUser = JSON.parse(storedDemoUser);
          set({ user: demoUser, loading: false });
          return;
        } catch (e) {
          console.error('Error parsing stored demo user:', e);
          localStorage.removeItem('demoUser');
        }
      }
      
      // Then check Supabase auth
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        set({ user: null, loading: false });
        return;
      }
      
      // Get user metadata
      const userMeta = data.user.user_metadata || {};
      const userRole = userMeta.role || 'student';
      const userName = userMeta.name || data.user.email?.split('@')[0] || 'User';
      
      set({ 
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: userRole,
          name: userName
        },
        loading: false
      });
    } catch (err) {
      console.error('Auth check error:', err);
      set({ user: null, loading: false });
    }
  }
}));