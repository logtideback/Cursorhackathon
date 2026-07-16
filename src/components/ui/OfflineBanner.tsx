import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors, radii, spacing } from '@/theme';

type OfflineBannerProps = {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Quiet offline / reconnect banner shared across product surfaces.
 * Prefer this over ad-hoc offline copy so messaging stays consistent.
 */
export function OfflineBanner({
  message = 'You’re offline. Some actions will sync when you reconnect.',
  actionLabel = 'Retry',
  onAction,
}: OfflineBannerProps) {
  return (
    <View
      style={styles.root}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Offline. ${message}`}
    >
      <View style={styles.copy}>
        <Text variant="label" tone="tertiary">
          Offline
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
