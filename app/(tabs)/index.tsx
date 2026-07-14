import { StyleSheet, View } from 'react-native';

import { EmptyState, Screen, Text } from '@/components';
import { spacing } from '@/theme';

export default function DiscoverScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="label" tone="tertiary">
          Discover
        </Text>
        <Text variant="heading">Taste</Text>
      </View>
      <EmptyState
        label="Deck"
        title="Swipe deck coming next"
        description="Gesture Handler and Reanimated are wired. The discover deck will land in features/discover."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
});
