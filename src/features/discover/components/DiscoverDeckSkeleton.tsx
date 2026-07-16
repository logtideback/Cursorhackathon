import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Skeleton, SkeletonBlock } from '@/components/ui/Skeleton';
import { spacing } from '@/theme';

/** Loading placeholder for the Discover swipe deck. */
export function DiscoverDeckSkeleton() {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - spacing.xl * 2, 420);
  const cardHeight = cardWidth * 1.25;

  return (
    <SkeletonBlock label="Loading design deck" style={styles.root}>
      <Skeleton width="40%" height={12} />
      <Skeleton width="70%" height={22} />
      <View style={styles.cardWrap}>
        <Skeleton width={cardWidth} height={cardHeight} radius="none" />
      </View>
      <View style={styles.actions}>
        <Skeleton width={88} height={44} />
        <Skeleton width={88} height={44} />
        <Skeleton width={88} height={44} />
      </View>
    </SkeletonBlock>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  cardWrap: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
