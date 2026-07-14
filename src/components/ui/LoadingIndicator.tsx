import { ActivityIndicator, StyleSheet, View, ViewStyle, type StyleProp } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/theme';

type LoadingIndicatorProps = {
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function LoadingIndicator({ label, style }: LoadingIndicatorProps) {
  return (
    <View style={[styles.root, style]} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.accent} size="small" />
      {label ? (
        <Text variant="caption" tone="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
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
