import { ActivityIndicator, StyleSheet, View, ViewStyle, type StyleProp } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/theme';

type LoadingIndicatorProps = {
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function LoadingIndicator({ label = 'Loading', style }: LoadingIndicatorProps) {
  return (
    <View
      style={[styles.root, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator color={colors.accent} size="small" />
      <Text variant="caption" tone="secondary" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  label: {
    textAlign: 'center',
  },
});
