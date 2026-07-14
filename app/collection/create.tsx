import { Redirect, Stack } from 'expo-router';

import { CreateCollectionScreen } from '@/features/collections';
import { useAuthStore } from '@/store/auth-store';

export default function CreateCollectionRoute() {
  const status = useAuthStore((s) => s.status);

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'New collection' }} />
      <CreateCollectionScreen />
    </>
  );
}
