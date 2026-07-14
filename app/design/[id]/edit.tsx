import { Redirect, useLocalSearchParams } from 'expo-router';

import { UploadWizardScreen } from '@/features/upload';
import { useAuthStore } from '@/store/auth-store';

export default function EditDesignRoute() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const { id } = useLocalSearchParams<{ id: string }>();
  const designId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <UploadWizardScreen userId={user?.id} editingDesignId={designId} />;
}
