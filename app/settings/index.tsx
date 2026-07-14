import { Redirect } from 'expo-router';

import { SettingsScreen } from '@/features/preferences';
import { useAuthStore } from '@/store/auth-store';

export default function SettingsRoute() {
  const status = useAuthStore((s) => s.status);
  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return <SettingsScreen />;
}
