import { Redirect } from 'expo-router';

import { UploadWizardScreen } from '@/features/upload';
import { useAuthStore } from '@/store/auth-store';

export default function UploadIndexRoute() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <UploadWizardScreen userId={user?.id} />;
}
