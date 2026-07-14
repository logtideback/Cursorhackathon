import { Redirect } from 'expo-router';

import { LoadingIndicator, Screen } from '@/components';
import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/store/onboarding-store';

/**
 * Root gate:
 * - loading/hydration → spinner
 * - unauthenticated → welcome
 * - authenticated + incomplete onboarding → preferences flow
 * - otherwise → Discover tabs
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
    return <Redirect href="/(auth)" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/preferences" />;
  }

  return <Redirect href="/(tabs)" />;
}
