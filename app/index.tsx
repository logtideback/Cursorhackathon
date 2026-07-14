import { Redirect } from 'expo-router';

import { LoadingIndicator, Screen } from '@/components';
import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/store/onboarding-store';

/**
 * Root entry chooses the correct route group based on lightweight client state.
 * Authenticated users who finished onboarding land on tabs; everyone else is
 * sent to public (auth) or (onboarding) groups.
 */
export default function Index() {
  const status = useAuthStore((s) => s.status);
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);
  const hasHydrated = useOnboardingStore((s) => s.hasHydrated);

  if (status === 'loading' || !hasHydrated) {
    return (
      <Screen>
        <LoadingIndicator label="Loading Taste" />
      </Screen>
    );
  }

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}
