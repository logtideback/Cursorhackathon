import { FlashList } from '@shopify/flash-list';
import type { ReactElement } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Image, PressableScale, Text } from '@/components';
import type { SearchDesignHit } from '@/features/search/types';
import { colors, spacing } from '@/theme';

type DesignResultsGridProps = {
  items: SearchDesignHit[];
  onPress: (item: SearchDesignHit) => void;
  onLongPress: (item: SearchDesignHit) => void;
  onEndReached?: () => void;
  ListFooterComponent?: ReactElement | null;
};

export function DesignResultsGrid({
  items,
  onPress,
  onLongPress,
  onEndReached,
  ListFooterComponent,
}: DesignResultsGridProps) {
  const { width } = useWindowDimensions();
  const gutter = spacing.xl;
  const gap = spacing.sm;
  const columnWidth = (width - gutter * 2 - gap) / 2;

  return (
    <FlashList
      data={items}
      numColumns={2}
      keyExtractor={(item) => item.id}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <PressableScale
          accessibilityLabel={`${item.title} by ${item.creatorName}`}
          accessibilityHint="Opens design detail. Long press for quick actions."
          onPress={() => onPress(item)}
          onLongPress={() => onLongPress(item)}
          minTouchTarget={false}
          style={[styles.cell, { width: columnWidth }]}
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl ?? item.imageUrl }}
              style={{ width: columnWidth, height: columnWidth * 1.25 }}
              contentFit="cover"
              recyclingKey={item.id}
              priority="normal"
            />
          ) : (
            <View style={[styles.fallback, { width: columnWidth, height: columnWidth * 1.25 }]}>
              <Text variant="caption" tone="secondary">
                No image
              </Text>
            </View>
          )}
        </PressableScale>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing['2xl'],
  },
  cell: {
    marginBottom: spacing.sm,
    marginRight: spacing.sm,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
});
