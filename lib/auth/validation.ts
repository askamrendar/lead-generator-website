import { z } from 'zod';

/**
 * Zod schemas for the authentication flows — shared by API routes (and, later,
 * client forms). PURE (only `zod`, already a project dependency) so it is
 * unit-testable in isolation (tests/auth-validation.test.mjs).
 */

/** Minimum password policy. Kept deliberately simple; tighten centrally here. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(200, 'Password is too long');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Please enter a valid email')
  .max(254);

export const registerSchema = z.object({
  name: z.string().min(1, 'Please enter your name').max(120),
  email: emailSchema,
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(16, 'Invalid or missing token').max(256),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(16, 'Invalid or missing token').max(256),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
