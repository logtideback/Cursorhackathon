import { StyleSheet, View } from 'react-native';

import { Button, EmptyState, Text } from '@/components';
import { spacing } from '@/theme';

type EmptyDeckStateProps = {
  onRefresh?: () => void;
  offline?: boolean;
};

export function EmptyDeckState({ onRefresh, offline = false }: EmptyDeckStateProps) {
  if (offline) {
    return (
      <EmptyState
        label="Offline"
        title="No designs to show offline"
        description="Connect to load your next set of recommendations. Saved work is still available under Collections."
        actionLabel={onRefresh ? 'Try again' : undefined}
        onAction={onRefresh}
        style={styles.root}
      />
    );
  }

  return (
    <View style={styles.root} accessibilityRole="summary">
      <Text variant="label" tone="tertiary">
        Deck clear
      </Text>
      <Text variant="title">You have seen everything for now</Text>
      <Text variant="body" tone="secondary" style={styles.body}>
        Check back later for new work, or revisit Saved to study what you kept.
      </Text>
      {onRefresh ? (
        <Button label="Refresh deck" variant="secondary" fullWidth={false} onPress={onRefresh} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing['3xl'],
  },
  body: {
    maxWidth: 320,
    marginBottom: spacing.sm,
  },
});
