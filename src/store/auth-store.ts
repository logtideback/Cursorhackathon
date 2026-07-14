import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import type { AuthStatus } from '@/types';

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  setSession: (session: Session | null) => void;
  setStatus: (status: AuthStatus) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  user: null,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      status: session ? 'authenticated' : 'unauthenticated',
    }),
  setStatus: (status) => set({ status }),
  reset: () =>
    set({
      status: 'unauthenticated',
      session: null,
      user: null,
    }),
}));
