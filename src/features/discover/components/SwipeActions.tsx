import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { spacing } from '@/theme';

type SwipeActionsProps = {
  disabled?: boolean;
  onPass: () => void;
  onSave: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onMore?: () => void;
};

export function SwipeActions({
  disabled = false,
  onPass,
  onSave,
  onUndo,
  canUndo = false,
  onMore,
}: SwipeActionsProps) {
  return (
    <View style={styles.root}>
      <Button
        label="Pass"
        variant="secondary"
        fullWidth={false}
        disabled={disabled}
        onPress={onPass}
        accessibilityHint="Dismiss this design"
        style={styles.action}
      />
      {canUndo && onUndo ? (
        <Button
          label="Undo"
          variant="ghost"
          fullWidth={false}
          disabled={disabled}
          onPress={onUndo}
          style={styles.action}
        />
      ) : null}
      {onMore ? (
        <Button
          label="Less"
          variant="ghost"
          fullWidth={false}
          disabled={disabled}
          onPress={onMore}
          accessibilityHint="Show me less like this or hide the creator"
          style={styles.action}
        />
      ) : null}
      <Button
        label="Save"
        fullWidth={false}
        disabled={disabled}
        onPress={onSave}
        accessibilityHint="Save this design to your collection"
        style={styles.action}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  action: {
    minWidth: 96,
    paddingHorizontal: spacing.lg,
  },
});
