import { PropsWithChildren, useEffect, useRef } from 'react';

import {
  identify,
  resetAnalytics,
  screen,
  track,
  useAnalyticsConsentStore,
} from '@/lib/analytics';
import { useAuthStore } from '@/store/auth-store';

/**
 * Bootstraps analytics identity lifecycle and `app_opened`.
 * Does not send events until consent allows tracking.
 */
export function AnalyticsBootstrap({ children }: PropsWithChildren) {
  const userId = useAuthStore((s) => s.user?.id);
  const status = useAuthStore((s) => s.status);
  const hasHydrated = useAnalyticsConsentStore((s) => s.hasHydrated);
  const openedRef = useRef(false);
  const identifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasHydrated || openedRef.current) {
      return;
    }
    openedRef.current = true;
    track({ name: 'app_opened', properties: { coldStart: true } });
    screen('app');
  }, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || status === 'loading') {
      return;
    }

    if (userId) {
      if (identifiedRef.current !== userId) {
        identify(userId);
        identifiedRef.current = userId;
      }
      return;
    }

    if (identifiedRef.current) {
      resetAnalytics();
      identifiedRef.current = null;
    }
  }, [hasHydrated, status, userId]);

  return children;
}
