import { StyleSheet } from 'react-native';

import { EmptyState, Screen, Text } from '@/components';
import { spacing } from '@/theme';

export default function CollectionsScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <Text variant="label" tone="tertiary">
        Collections
      </Text>
      <Text variant="title">Your saves</Text>
      <EmptyState
        title="No collections yet"
        description="Saved designs from right-swipes will appear here."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
});
