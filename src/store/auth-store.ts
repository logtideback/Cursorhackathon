import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import type { AuthStatus } from '@/types';

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  /** True while the user must finish choosing a new password after a recovery link. */
  passwordRecoveryPending: boolean;
  setSession: (session: Session | null) => void;
  setStatus: (status: AuthStatus) => void;
  setPasswordRecoveryPending: (pending: boolean) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  user: null,
  passwordRecoveryPending: false,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      status: session ? 'authenticated' : 'unauthenticated',
    }),
  setStatus: (status) => set({ status }),
  setPasswordRecoveryPending: (passwordRecoveryPending) => set({ passwordRecoveryPending }),
  reset: () =>
    set({
      status: 'unauthenticated',
      session: null,
      user: null,
      passwordRecoveryPending: false,
    }),
}));
