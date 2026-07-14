import { AuthError } from '@supabase/supabase-js';

import { getErrorMessage } from '@/utils/errors';

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email or password is incorrect.',
  email_not_confirmed: 'Confirm your email before signing in.',
  user_already_exists: 'An account with this email already exists.',
  user_already_registered: 'An account with this email already exists.',
  over_email_send_rate_limit: 'Too many emails sent. Wait a moment and try again.',
  over_request_rate_limit: 'Too many attempts. Wait a moment and try again.',
  weak_password: 'Choose a stronger password.',
  same_password: 'Choose a password you have not used before.',
  otp_expired: 'This magic link has expired. Request a new one.',
  flow_state_expired: 'This sign-in link has expired. Request a new one.',
};

export function friendlyAuthError(error: unknown): string {
  if (error && typeof error === 'object') {
    const authError = error as AuthError & { code?: string };
    if (authError.code) {
      const mapped = AUTH_MESSAGES[authError.code];
      if (mapped) {
        return mapped;
      }
    }

    const message = authError.message?.toLowerCase() ?? '';
    if (message.includes('invalid login credentials')) {
      return AUTH_MESSAGES.invalid_credentials ?? 'Email or password is incorrect.';
    }
    if (message.includes('already registered') || message.includes('already been registered')) {
      return AUTH_MESSAGES.user_already_registered ?? 'An account with this email already exists.';
    }
    if (message.includes('email not confirmed')) {
      return AUTH_MESSAGES.email_not_confirmed ?? 'Confirm your email before signing in.';
    }
    if (message.includes('rate limit')) {
      return (
        AUTH_MESSAGES.over_request_rate_limit ?? 'Too many attempts. Wait a moment and try again.'
      );
    }
  }

  return getErrorMessage(error, 'Something went wrong. Please try again.');
}
