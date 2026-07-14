import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components';
import type { UploadImageProgress } from '@/features/upload/types';
import { colors, radii, spacing } from '@/theme';

type UploadProgressListProps = {
  items: UploadImageProgress[];
  onCancel?: () => void;
  onRetry?: () => void;
  busy?: boolean;
};

export function UploadProgressList({
  items,
  onCancel,
  onRetry,
  busy = false,
}: UploadProgressListProps) {
  const failed = items.some((item) => item.status === 'failed');
  const overall =
    items.length === 0 ? 0 : items.reduce((sum, item) => sum + item.progress, 0) / items.length;

  return (
    <View style={styles.root}>
      <Text variant="label" tone="tertiary">
        Upload progress
      </Text>
      <View style={styles.track} accessibilityRole="progressbar">
        <View style={[styles.fill, { width: `${Math.round(overall * 100)}%` }]} />
      </View>
      <Text variant="caption" tone="secondary">
        {Math.round(overall * 100)}% complete
      </Text>

      {items.map((item, index) => (
        <View key={item.localId} style={styles.row}>
          <Text variant="caption">Image {index + 1}</Text>
          <Text variant="caption" tone="secondary">
            {item.status}
            {item.attempts > 1 ? ` · try ${item.attempts}` : ''}
          </Text>
        </View>
      ))}

      {failed ? (
        <Text variant="caption" tone="danger">
          One or more images failed. Partially uploaded files were cleaned up.
        </Text>
      ) : null}

      <View style={styles.actions}>
        {busy && onCancel ? (
          <Button label="Cancel upload" variant="secondary" onPress={onCancel} />
        ) : null}
        {failed && onRetry ? <Button label="Retry upload" onPress={onRetry} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  track: {
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
