import { Alert, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components';
import { colors, spacing } from '@/theme';

type CreatorActionsProps = {
  isSelf: boolean;
  isBlocking: boolean;
  onReport: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  blockLoading?: boolean;
};

export function CreatorActions({
  isSelf,
  isBlocking,
  onReport,
  onBlock,
  onUnblock,
  blockLoading = false,
}: CreatorActionsProps) {
  if (isSelf) {
    return null;
  }

  return (
    <View style={styles.root}>
      <Text variant="label" tone="tertiary">
        Safety
      </Text>
      <Button label="Report creator" variant="secondary" onPress={onReport} />
      {isBlocking ? (
        <Button
          label="Unblock creator"
          variant="ghost"
          loading={blockLoading}
          onPress={onUnblock}
        />
      ) : (
        <Button
          label="Block creator"
          variant="ghost"
          loading={blockLoading}
          onPress={() => {
            Alert.alert(
              'Block this creator?',
              'You will no longer see their designs in Discover or Search. You can unblock later from this profile.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Block', style: 'destructive', onPress: onBlock },
              ],
            );
          }}
        />
      )}
      <Text variant="caption" tone="tertiary" style={styles.note}>
        Reports stay private. Blocks only affect what you see.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  note: {
    marginTop: spacing.xs,
  },
});
