import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme';

type DiscoverHeaderProps = {
  subtitle?: string;
};

export function DiscoverHeader({
  subtitle = 'Consider one design at a time',
}: DiscoverHeaderProps) {
  return (
    <View style={styles.root} accessibilityRole="header">
      <Text variant="label" tone="tertiary">
        Discover
      </Text>
      <Text variant="title">Taste</Text>
      <Text variant="caption" tone="secondary">
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
});
