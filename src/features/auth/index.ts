import { Session } from '@supabase/supabase-js';

import {
  getCurrentUser,
  getSession,
  sendPasswordResetEmail,
  signInWithEmail,
  signInWithMagicLink,
  signOut,
  signUpWithEmail,
} from '@/services/auth';

export const authApi = {
  getSession,
  getCurrentUser,
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
  sendPasswordResetEmail,
  signOut,
};

export type AuthSession = Session;
