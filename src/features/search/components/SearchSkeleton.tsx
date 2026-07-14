import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { colors, spacing } from '@/theme';

type SearchSkeletonProps = {
  variant?: 'grid' | 'rows';
};

export function SearchSkeleton({ variant = 'grid' }: SearchSkeletonProps) {
  const { width } = useWindowDimensions();
  const gutter = spacing.xl;
  const gap = spacing.sm;
  const columnWidth = (width - gutter * 2 - gap) / 2;

  if (variant === 'rows') {
    return (
      <View style={styles.rows} accessibilityLabel="Loading results">
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.row} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.grid} accessibilityLabel="Loading design results">
      {Array.from({ length: 6 }).map((_, index) => (
        <View
          key={index}
          style={[styles.tile, { width: columnWidth, height: columnWidth * 1.25 }]}
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
  tile: {
    backgroundColor: colors.surfaceMuted,
  },
  rows: {
    gap: spacing.sm,
  },
  row: {
    height: 64,
    backgroundColor: colors.surfaceMuted,
  },
});
