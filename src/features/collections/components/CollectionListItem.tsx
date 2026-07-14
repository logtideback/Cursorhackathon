import { StyleSheet, View } from 'react-native';

import { PressableScale, Text } from '@/components';
import { CollectionCover } from '@/features/collections/components/CollectionCover';
import { MIN_TOUCH_TARGET } from '@/features/collections/constants';
import type { CollectionSummary } from '@/features/collections/types';
import { spacing } from '@/theme';

type CollectionListItemProps = {
  collection: CollectionSummary;
  onPress: () => void;
};

export function CollectionListItem({ collection, onPress }: CollectionListItemProps) {
  const privacy = collection.is_private ? 'Private' : 'Public';
  const countLabel = `${collection.designCount} ${collection.designCount === 1 ? 'design' : 'designs'}`;

  return (
    <PressableScale
      accessibilityLabel={`${collection.name}, ${countLabel}, ${privacy}`}
      accessibilityHint="Opens collection"
      onPress={onPress}
      style={styles.root}
    >
      <CollectionCover
        urls={collection.mosaicUrls}
        height={220}
        accessibilityLabel={`${collection.name} cover`}
      />
      <View style={styles.meta}>
        <Text variant="title">{collection.name}</Text>
        <Text variant="caption" tone="secondary">
          {countLabel}
          {collection.is_default ? ' · Default' : ''} · {privacy}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    marginBottom: spacing['2xl'],
  },
  meta: {
    gap: spacing.xs,
  },
});
