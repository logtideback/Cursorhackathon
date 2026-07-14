import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors, radii, spacing } from '@/theme';

type NetworkErrorBannerProps = {
  message: string;
  offline?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function NetworkErrorBanner({
  message,
  offline = false,
  actionLabel = 'Retry',
  onAction,
}: NetworkErrorBannerProps) {
  return (
    <View style={styles.root} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.copy}>
        <Text variant="label" tone="tertiary">
          {offline ? 'Offline' : 'Connection'}
        </Text>
        <Text variant="caption" tone="primary">
          {message}
        </Text>
      </View>
      {onAction ? (
        <Button label={actionLabel} variant="secondary" fullWidth={false} onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
});
