import { Redirect, Stack, useLocalSearchParams } from 'expo-router';

import { CollectionDetailScreen } from '@/features/collections';
import { useAuthStore } from '@/store/auth-store';

export default function CollectionDetailRoute() {
  const status = useAuthStore((s) => s.status);
  const { id } = useLocalSearchParams<{ id: string }>();
  const collectionId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Collection' }} />
      <CollectionDetailScreen collectionId={collectionId} />
    </>
  );
}
