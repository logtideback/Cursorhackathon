import { Redirect } from 'expo-router';

import { CreatorProfileScreen } from '@/features/creators';
import { useAuthStore } from '@/store/auth-store';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!user?.id) {
    return null;
  }

  return <CreatorProfileScreen creatorId={user.id} showAccountActions />;
}
