import { Redirect } from 'expo-router';

import { TasteProfileScreen } from '@/features/preferences';
import { useAuthStore } from '@/store/auth-store';

export default function TasteProfileRoute() {
  const status = useAuthStore((s) => s.status);
  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return <TasteProfileScreen />;
}
