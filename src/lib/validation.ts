import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens and apostrophes');

// Separate schemas for signup and login roles
export const signupRoleSchema = z.enum(['student', 'instructor'], {
  errorMap: () => ({ message: 'Please select either student or instructor' }),
});

export const loginRoleSchema = z.enum(['student', 'instructor', 'admin'], {
  errorMap: () => ({ message: 'Invalid role selected' }),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: signupRoleSchema,
  name: nameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  role: loginRoleSchema,
});