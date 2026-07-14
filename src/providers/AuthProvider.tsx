import * as Linking from 'expo-linking';
import { PropsWithChildren, useEffect } from 'react';

import { crashReporting } from '@/lib/crash-reporting';
import { isEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { fetchCurrentProfile } from '@/services/profiles';
import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/store/onboarding-store';

function urlLooksLikePasswordRecovery(url: string): boolean {
  const parsed = Linking.parse(url);
  const hash = url.split('#')[1];
  const hashParams = new URLSearchParams(hash ?? '');
  const type =
    (typeof parsed.queryParams?.type === 'string' ? parsed.queryParams.type : null) ??
    hashParams.get('type');
  if (type === 'recovery') {
    return true;
  }
  const path = (parsed.path ?? '').replace(/^\//, '');
  return path === 'reset-password' || path.endsWith('reset-password');
}

async function createSessionFromUrl(url: string) {
  const parsed = Linking.parse(url);
  const accessToken =
    typeof parsed.queryParams?.access_token === 'string' ? parsed.queryParams.access_token : null;
  const refreshToken =
    typeof parsed.queryParams?.refresh_token === 'string' ? parsed.queryParams.refresh_token : null;

  const hash = url.split('#')[1];
  const hashParams = new URLSearchParams(hash ?? '');
  const hashAccess = hashParams.get('access_token');
  const hashRefresh = hashParams.get('refresh_token');

  const access = hashAccess ?? accessToken;
  const refresh = hashRefresh ?? refreshToken;

  if (urlLooksLikePasswordRecovery(url)) {
    useAuthStore.getState().setPasswordRecoveryPending(true);
  }

  if (access && refresh) {
    await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
    return;
  }

  const code =
    typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : hashParams.get('code');
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const setSession = useAuthStore((s) => s.setSession);
  const setStatus = useAuthStore((s) => s.setStatus);
  const setPasswordRecoveryPending = useAuthStore((s) => s.setPasswordRecoveryPending);
  const syncFromProfile = useOnboardingStore((s) => s.syncFromProfile);

  useEffect(() => {
    let mounted = true;

    async function hydrateProfile() {
      if (!isEnvConfigured()) {
        return;
      }
      try {
        const profile = await fetchCurrentProfile();
        if (mounted && profile) {
          syncFromProfile(profile.onboarding_completed);
        }
      } catch {
        // Profile may not exist yet during first bootstrap.
      }
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) {
        return;
      }
      if (error) {
        setStatus('unauthenticated');
        return;
      }
      setSession(data.session);
      if (data.session) {
        void hydrateProfile();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryPending(true);
      }
      setSession(session);
      crashReporting.setUser(session?.user?.id ?? null);
      if (session) {
        void hydrateProfile();
      } else {
        setPasswordRecoveryPending(false);
        syncFromProfile(false);
      }
    });

    const handleUrl = ({ url }: { url: string }) => {
      void createSessionFromUrl(url).catch(() => undefined);
    };

    const linkingSub = Linking.addEventListener('url', handleUrl);
    void Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl({ url });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      linkingSub.remove();
    };
  }, [setSession, setStatus, setPasswordRecoveryPending, syncFromProfile]);

  return children;
}
