import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/theme';

type BatchProgressProps = {
  considered: number;
  saved: number;
};

export function BatchProgress({ considered, saved }: BatchProgressProps) {
  return (
    <View style={styles.root} accessibilityRole="text">
      <Text variant="label" tone="tertiary">
        Session
      </Text>
      <View style={styles.row}>
        <Text variant="caption" tone="secondary">
          {considered} considered
        </Text>
        <View style={styles.dot} />
        <Text variant="caption" tone="secondary">
          {saved} saved
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1,
    backgroundColor: colors.borderStrong,
  },
});
