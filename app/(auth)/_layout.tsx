import { Redirect, Stack } from 'expo-router';

import { LoadingIndicator, Screen } from '@/components';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/theme';

/** Public auth group — welcome, carousel, sign-in/up, magic link, forgot password. */
export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') {
    return (
      <Screen>
        <LoadingIndicator />
      </Screen>
    );
  }

  if (status === 'authenticated') {
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
