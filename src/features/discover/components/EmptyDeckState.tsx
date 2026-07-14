import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme';

type EmptyDeckStateProps = {
  onRefresh?: () => void;
};

export function EmptyDeckState({ onRefresh }: EmptyDeckStateProps) {
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
