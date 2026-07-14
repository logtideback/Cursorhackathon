import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Skeleton, SkeletonBlock } from '@/components/ui/Skeleton';
import { spacing } from '@/theme';

/** Loading placeholder for creator profiles. */
export function CreatorProfileSkeleton() {
  const { width } = useWindowDimensions();
  const gap = spacing.sm;
  const tileWidth = Math.floor((width - spacing.xl * 2 - gap) / 2);

  return (
    <SkeletonBlock label="Loading creator profile" style={styles.root}>
      <View style={styles.header}>
        <Skeleton width={72} height={72} />
        <View style={styles.headerCopy}>
          <Skeleton width="50%" height={22} />
          <Skeleton width="35%" height={14} />
        </View>
      </View>
      <Skeleton width="100%" height={48} />
      <View style={styles.stats}>
        <Skeleton width="28%" height={36} />
        <Skeleton width="28%" height={36} />
        <Skeleton width="28%" height={36} />
      </View>
      <View style={styles.grid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} width={tileWidth} height={tileWidth * 1.25} radius="none" />
        ))}
      </View>
    </SkeletonBlock>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
