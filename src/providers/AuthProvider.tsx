import { PropsWithChildren, useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

export function AuthProvider({ children }: PropsWithChildren) {
  const setSession = useAuthStore((s) => s.setSession);
  const setStatus = useAuthStore((s) => s.setStatus);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) {
        return;
      }
      if (error) {
        setStatus('unauthenticated');
        return;
      }
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setStatus]);

  return children;
}
