import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { UndoToastState } from '@/features/discover/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, radii, spacing } from '@/theme';
import type { SwipeDirection } from '@/types/database';

type UndoToastProps = {
  toast: UndoToastState;
  onUndo: () => void;
  onDismiss: () => void;
  onMoveToCollection?: () => void;
  undoing?: boolean;
};

export function UndoToast({
  toast,
  onUndo,
  onDismiss,
  onMoveToCollection,
  undoing = false,
}: UndoToastProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!toast.visible) {
      return;
    }
    const timer = setTimeout(() => onDismiss(), 5200);
    return () => clearTimeout(timer);
  }, [toast.visible, toast.designId, onDismiss]);

  if (!toast.visible || !toast.direction) {
    return null;
  }

  const direction: SwipeDirection = toast.direction;

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(220)}
      exiting={reducedMotion ? undefined : FadeOutDown.duration(180)}
      style={styles.root}
      accessibilityRole="summary"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.copy}>
        <Text variant="label" tone="tertiary">
          {direction === 'right' ? 'Saved' : 'Passed'}
        </Text>
        <Text variant="bodyStrong" numberOfLines={1}>
          {toast.title ?? 'Design'}
        </Text>
        <Text variant="caption" tone="secondary">
          {toast.message}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button
          label="Undo"
          variant="secondary"
          fullWidth={false}
          loading={undoing}
          onPress={onUndo}
        />
        {direction === 'right' && onMoveToCollection ? (
          <Button label="Organise" variant="ghost" fullWidth={false} onPress={onMoveToCollection} />
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    gap: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  actions: {
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
});
