import { Redirect, useLocalSearchParams } from 'expo-router';

import { CreatorProfileScreen } from '@/features/creators';
import { useAuthStore } from '@/store/auth-store';

export default function CreatorDetailScreen() {
  const status = useAuthStore((s) => s.status);
  const { id } = useLocalSearchParams<{ id: string }>();
  const creatorId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <CreatorProfileScreen creatorId={creatorId} />;
}
