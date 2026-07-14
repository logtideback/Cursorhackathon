import { Session } from '@supabase/supabase-js';

import { getSession, signInWithEmail, signOut, signUpWithEmail } from '@/services/auth';

export const authApi = {
  getSession,
  signInWithEmail,
  signUpWithEmail,
  signOut,
};

export type AuthSession = Session;
