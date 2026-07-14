import { Redirect, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Screen, Text } from '@/components';
import { useAuthStore } from '@/store/auth-store';
import { spacing } from '@/theme';

export default function CreatorDetailScreen() {
  const status = useAuthStore((s) => s.status);
  const { id } = useLocalSearchParams<{ id: string }>();

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Screen contentStyle={styles.content}>
      <Text variant="label" tone="tertiary">
        Creator
      </Text>
      <Text variant="title">{id}</Text>
      <Text variant="body" tone="secondary">
        Creator profiles will load from features/creators.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
});
