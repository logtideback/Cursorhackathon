import { Redirect, Stack, useSegments } from 'expo-router';

import { LoadingIndicator, Screen } from '@/components';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/theme';

/** Public auth group — welcome, carousel, sign-in/up, magic link, forgot/reset password. */
export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);
  const passwordRecoveryPending = useAuthStore((s) => s.passwordRecoveryPending);
  const segments = useSegments();
  const onResetPassword = segments.includes('reset-password');

  if (status === 'loading') {
    return (
      <Screen>
        <LoadingIndicator />
      </Screen>
    );
  }

  // Keep recovery users on the reset screen even though a session is already active.
  if (status === 'authenticated' && !(passwordRecoveryPending || onResetPassword)) {
    return <Redirect href="/" />;
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
