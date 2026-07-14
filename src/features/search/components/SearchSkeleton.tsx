import { StyleSheet, useWindowDimensions } from 'react-native';

import { Skeleton, SkeletonBlock } from '@/components/ui/Skeleton';
import { spacing } from '@/theme';

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
      <SkeletonBlock label="Loading results" style={styles.rows}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} height={64} radius="none" />
        ))}
      </SkeletonBlock>
    );
  }

  return (
    <SkeletonBlock label="Loading design results" style={styles.grid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} width={columnWidth} height={columnWidth * 1.25} radius="none" />
      ))}
    </SkeletonBlock>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rows: {
    gap: spacing.sm,
  },
});
