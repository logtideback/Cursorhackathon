import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState, Image, PressableScale, Text } from '@/components';
import type { CreatorPublicCollection } from '@/features/creators/types';
import { colors, radii, spacing } from '@/theme';

type CreatorPublicCollectionsProps = {
  collections: CreatorPublicCollection[];
  isSelf?: boolean;
};

export function CreatorPublicCollections({
  collections,
  isSelf = false,
}: CreatorPublicCollectionsProps) {
  if (collections.length === 0) {
    return (
      <EmptyState
        label="Collections"
        title="No public collections"
        description={
          isSelf
            ? 'Public collections you create will appear here. Private collections stay hidden.'
            : 'This creator has not shared any public collections.'
        }
      />
    );
  }

  return (
    <View style={styles.list}>
      {collections.map((collection) => (
        <PressableScale
          key={collection.id}
          style={styles.row}
          accessibilityLabel={`Open collection ${collection.name}`}
          onPress={() => router.push(`/collection/${collection.id}`)}
        >
          {collection.cover_image_url ? (
            <Image
              source={{ uri: collection.cover_image_url }}
              style={styles.cover}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.cover, styles.coverFallback]} />
          )}
          <View style={styles.copy}>
            <Text variant="bodyStrong">{collection.name}</Text>
            {collection.description ? (
              <Text variant="caption" tone="secondary" numberOfLines={2}>
                {collection.description}
              </Text>
            ) : (
              <Text variant="caption" tone="tertiary">
                Public collection
              </Text>
            )}
          </View>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  cover: {
    width: 64,
    height: 80,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  coverFallback: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
});
