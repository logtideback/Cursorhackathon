import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Skeleton, SkeletonBlock } from '@/components/ui/Skeleton';
import { spacing } from '@/theme';

type CollectionsSkeletonProps = {
  variant?: 'overview' | 'detail';
};

/** Loading placeholder for Collections overview / detail. */
export function CollectionsSkeleton({ variant = 'overview' }: CollectionsSkeletonProps) {
  const { width } = useWindowDimensions();
  const gutter = spacing.xl;
  const gap = spacing.sm;
  const columnWidth = (width - gutter * 2 - gap) / 2;

  if (variant === 'detail') {
    return (
      <SkeletonBlock label="Loading collection" style={styles.root}>
        <Skeleton width="34%" height={12} />
        <Skeleton width="62%" height={28} />
        <Skeleton width="80%" height={14} />
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} width={columnWidth} height={columnWidth * 1.25} radius="none" />
          ))}
        </View>
      </SkeletonBlock>
    );
  }

  return (
    <SkeletonBlock label="Loading collections" style={styles.root}>
      <Skeleton width="30%" height={12} />
      <Skeleton width="48%" height={32} />
      <Skeleton width="88%" height={14} />
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.row}>
          <Skeleton width={72} height={72} radius="none" />
          <View style={styles.rowCopy}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </SkeletonBlock>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs,
  },
});
