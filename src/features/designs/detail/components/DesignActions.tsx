import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components';
import { spacing } from '@/theme';

type DesignActionsProps = {
  isSaved: boolean;
  onSave: () => void;
  onAddToCollection: () => void;
  onShare: () => void;
  onReport: () => void;
  saveLoading?: boolean;
};

export function DesignActions({
  isSaved,
  onSave,
  onAddToCollection,
  onShare,
  onReport,
  saveLoading = false,
}: DesignActionsProps) {
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Button
          label={isSaved ? 'Saved' : 'Save'}
          variant={isSaved ? 'secondary' : 'primary'}
          onPress={onSave}
          loading={saveLoading}
          accessibilityHint={
            isSaved
              ? 'Already saved. Opens options to manage collections and notes.'
              : 'Save this design to your default Saved collection'
          }
          style={styles.flex}
        />
        <Button
          label="Collection"
          variant="secondary"
          onPress={onAddToCollection}
          accessibilityHint="Add this design to another collection"
          style={styles.flex}
        />
      </View>
      <View style={styles.row}>
        <Button
          label="Share"
          variant="ghost"
          onPress={onShare}
          accessibilityHint="Opens the system share sheet"
          style={styles.flex}
        />
        <Button
          label="Report"
          variant="ghost"
          onPress={onReport}
          accessibilityHint="Report a problem with this design"
          style={styles.flex}
        />
      </View>
      {isSaved ? (
        <Text variant="caption" tone="secondary">
          Already in your collection. You can add it elsewhere, attach a note, or remove it.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
