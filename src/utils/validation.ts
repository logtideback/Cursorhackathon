import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .email('Enter a valid email address.');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be under 72 characters.');

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
});

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const magicLinkSchema = z.object({
  email: emailSchema,
});

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters.')
  .max(30, 'Username must be 30 characters or fewer.')
  .regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers, and underscores only.');

export const profileSetupSchema = z.object({
  username: usernameSchema,
  displayName: z
    .string()
    .trim()
    .min(1, 'Enter a display name.')
    .max(60, 'Display name must be under 60 characters.'),
  bio: z
    .string()
    .trim()
    .max(500, 'Bio must be 500 characters or fewer.')
    .optional()
    .or(z.literal('')),
  websiteUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine(
      (value) => !value || /^https?:\/\//i.test(value),
      'Website must start with http:// or https://',
    ),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ProfileSetupValues = z.infer<typeof profileSetupSchema>;

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Check the form and try again.';
}

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}
