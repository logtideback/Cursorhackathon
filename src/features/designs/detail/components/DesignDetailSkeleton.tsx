import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Skeleton, SkeletonBlock } from '@/components/ui/Skeleton';
import { spacing } from '@/theme';

/** Loading placeholder for Design Detail. */
export function DesignDetailSkeleton() {
  const { width } = useWindowDimensions();

  return (
    <SkeletonBlock label="Loading design" style={styles.root}>
      <Skeleton width={width} height={width * 1.15} radius="none" />
      <View style={styles.body}>
        <Skeleton width="28%" height={12} />
        <Skeleton width="78%" height={28} />
        <Skeleton width="52%" height={16} />
        <View style={styles.row}>
          <Skeleton width={44} height={44} />
          <View style={styles.meta}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="35%" height={12} />
          </View>
        </View>
        <Skeleton width="100%" height={64} />
        <View style={styles.similar}>
          <Skeleton width="40%" height={14} />
          <View style={styles.similarRow}>
            <Skeleton width={(width - spacing.xl * 2 - spacing.sm) / 2} height={140} />
            <Skeleton width={(width - spacing.xl * 2 - spacing.sm) / 2} height={140} />
          </View>
        </View>
      </View>
    </SkeletonBlock>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  meta: {
    flex: 1,
    gap: spacing.xs,
  },
  similar: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  similarRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
