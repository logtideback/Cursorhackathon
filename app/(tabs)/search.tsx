import { StyleSheet } from 'react-native';

import { EmptyState, Screen, Text } from '@/components';
import { spacing } from '@/theme';

export default function SearchScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <Text variant="label" tone="tertiary">
        Search
      </Text>
      <Text variant="title">Find designs</Text>
      <EmptyState
        title="Search is not connected yet"
        description="Query hooks for designs, creators, and tags will live under features/search."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
});
