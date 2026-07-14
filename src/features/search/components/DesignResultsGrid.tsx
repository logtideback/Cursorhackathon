import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Image, PressableScale, Text } from '@/components';
import type { SearchDesignHit } from '@/features/search/types';
import { colors, spacing } from '@/theme';

type DesignResultsGridProps = {
  items: SearchDesignHit[];
  onPress: (item: SearchDesignHit) => void;
  onLongPress: (item: SearchDesignHit) => void;
};

export function DesignResultsGrid({ items, onPress, onLongPress }: DesignResultsGridProps) {
  const { width } = useWindowDimensions();
  const gutter = spacing.xl;
  const gap = spacing.sm;
  const columnWidth = (width - gutter * 2 - gap) / 2;

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <PressableScale
          key={item.id}
          accessibilityLabel={`${item.title} by ${item.creatorName}`}
          accessibilityHint="Opens design detail. Long press for quick actions."
          onPress={() => onPress(item)}
          onLongPress={() => onLongPress(item)}
          style={{ width: columnWidth }}
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl ?? item.imageUrl }}
              style={{ width: columnWidth, height: columnWidth * 1.25 }}
              contentFit="cover"
              recyclingKey={item.id}
            />
          ) : (
            <View style={[styles.fallback, { width: columnWidth, height: columnWidth * 1.25 }]}>
              <Text variant="caption" tone="secondary">
                No image
              </Text>
            </View>
          )}
        </PressableScale>
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
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
});
