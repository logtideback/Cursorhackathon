import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Image, PressableScale, Text } from '@/components';
import { MIN_TOUCH_TARGET } from '@/features/collections/constants';
import type { CollectionDesignItem } from '@/features/collections/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { animation, colors, spacing } from '@/theme';

type CollectionDesignGridProps = {
  items: CollectionDesignItem[];
  reorderEnabled?: boolean;
  onOpenDesign: (item: CollectionDesignItem) => void;
  onLongPressItem?: (item: CollectionDesignItem) => void;
  onMoveEarlier?: (item: CollectionDesignItem) => void;
  onMoveLater?: (item: CollectionDesignItem) => void;
  onReorderSwap?: (fromItemId: string, toItemId: string) => void;
};

function GridTile({
  item,
  width,
  height,
  reorderEnabled,
  onOpenDesign,
  onLongPressItem,
  onMoveEarlier,
  onMoveLater,
  onReorderSwap,
}: {
  item: CollectionDesignItem;
  width: number;
  height: number;
  reorderEnabled?: boolean;
  onOpenDesign: (item: CollectionDesignItem) => void;
  onLongPressItem?: (item: CollectionDesignItem) => void;
  onMoveEarlier?: (item: CollectionDesignItem) => void;
  onMoveLater?: (item: CollectionDesignItem) => void;
  onReorderSwap?: (fromItemId: string, toItemId: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    zIndex: scale.value > 1 ? 2 : 1,
  }));

  const pan = Gesture.Pan()
    .enabled(Boolean(reorderEnabled && onReorderSwap))
    .activateAfterLongPress(280)
    .onStart(() => {
      // eslint-disable-next-line react-hooks/immutability -- shared value API
      scale.value = withTiming(1.04, {
        duration: reducedMotion ? 0 : animation.duration.fast,
      });
    })
    .onUpdate((event) => {
      // eslint-disable-next-line react-hooks/immutability -- shared value API
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const threshold = height * 0.55;
      if (event.translationY < -threshold && onMoveEarlier) {
        runOnJS(onMoveEarlier)(item);
      } else if (event.translationY > threshold && onMoveLater) {
        runOnJS(onMoveLater)(item);
      }
      // eslint-disable-next-line react-hooks/immutability -- shared value API
      translateY.value = withTiming(0, {
        duration: reducedMotion ? 0 : animation.duration.fast,
      });
      // eslint-disable-next-line react-hooks/immutability -- shared value API
      scale.value = withTiming(1, {
        duration: reducedMotion ? 0 : animation.duration.fast,
      });
    });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ width }, animatedStyle]}>
        <PressableScale
          accessibilityLabel={
            item.unavailable
              ? 'Unavailable design'
              : `${item.title ?? 'Design'}${item.note ? ', has note' : ''}`
          }
          accessibilityHint={
            reorderEnabled
              ? 'Long press and drag to reorder. Double tap to open actions.'
              : 'Opens design detail'
          }
          onPress={() => onOpenDesign(item)}
          onLongPress={() => onLongPressItem?.(item)}
          style={styles.cell}
        >
          {item.imageUrl && !item.unavailable ? (
            <Image
              source={{ uri: item.thumbnailUrl ?? item.imageUrl }}
              style={{ width, height }}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.unavailable, { width, height }]}>
              <Text variant="caption" tone="secondary">
                Unavailable
              </Text>
            </View>
          )}
          {reorderEnabled ? (
            <View style={styles.reorderBar}>
              <PressableScale
                accessibilityLabel="Move earlier"
                onPress={() => onMoveEarlier?.(item)}
                style={styles.reorderButton}
              >
                <Text variant="caption">Up</Text>
              </PressableScale>
              <PressableScale
                accessibilityLabel="Move later"
                onPress={() => onMoveLater?.(item)}
                style={styles.reorderButton}
              >
                <Text variant="caption">Down</Text>
              </PressableScale>
            </View>
          ) : null}
        </PressableScale>
      </Animated.View>
    </GestureDetector>
  );
}

export function CollectionDesignGrid({
  items,
  reorderEnabled,
  onOpenDesign,
  onLongPressItem,
  onMoveEarlier,
  onMoveLater,
  onReorderSwap,
}: CollectionDesignGridProps) {
  const { width } = useWindowDimensions();
  const gutter = spacing.xl;
  const gap = spacing.sm;
  const columnWidth = (width - gutter * 2 - gap) / 2;
  const imageHeight = columnWidth * 1.25;

  return (
    <View style={styles.grid} accessibilityLabel="Collection designs">
      {items.map((item) => (
        <GridTile
          key={item.itemId}
          item={item}
          width={columnWidth}
          height={imageHeight}
          reorderEnabled={reorderEnabled}
          onOpenDesign={onOpenDesign}
          onLongPressItem={onLongPressItem}
          onMoveEarlier={onMoveEarlier}
          onMoveLater={onMoveLater}
          onReorderSwap={onReorderSwap}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    gap: spacing.xs,
  },
  unavailable: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  reorderBar: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  reorderButton: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
});
