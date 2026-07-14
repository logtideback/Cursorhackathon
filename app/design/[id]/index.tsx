import { Redirect, Stack, useLocalSearchParams } from 'expo-router';

import { DesignDetailScreen } from '@/features/designs';
import { useAuthStore } from '@/store/auth-store';

export default function DesignDetailRoute() {
  const status = useAuthStore((s) => s.status);
  const { id } = useLocalSearchParams<{ id: string }>();
  const designId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerBackTitle: 'Back',
          headerTransparent: true,
          headerBlurEffect: undefined,
        }}
      />
      <DesignDetailScreen designId={designId} />
    </>
  );
}
