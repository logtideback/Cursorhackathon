import { Redirect, Stack } from 'expo-router';

import { LoadingIndicator, Screen } from '@/components';
import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { colors } from '@/theme';

/** Authenticated onboarding — preferences then profile setup. */
export default function OnboardingLayout() {
  const status = useAuthStore((s) => s.status);
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);
  const hasHydrated = useOnboardingStore((s) => s.hasHydrated);

  if (status === 'loading' || !hasHydrated) {
    return (
      <Screen>
        <LoadingIndicator />
      </Screen>
    );
  }

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)" />;
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    />
  );
}
