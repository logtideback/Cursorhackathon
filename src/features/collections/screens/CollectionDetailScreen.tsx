import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button, EmptyState, ErrorState, LoadingIndicator, Screen, Text } from '@/components';
import { CollectionCover } from '@/features/collections/components/CollectionCover';
import { CollectionDesignGrid } from '@/features/collections/components/CollectionDesignGrid';
import { CollectionSharingState } from '@/features/collections/components/CollectionSharingState';
import { ItemActionsSheet } from '@/features/collections/components/ItemActionsSheet';
import { resolveCoverSources } from '@/features/collections/cover';
import { useCollectionDetail } from '@/features/collections/hooks/useCollectionDetail';
import { useCollectionsOverview } from '@/features/collections/hooks/useCollectionsOverview';
import { buildPublicCollectionShareUrl, sharePublicCollection } from '@/features/collections/share';
import type { CollectionDesignItem } from '@/features/collections/types';
import { spacing } from '@/theme';

type CollectionDetailScreenProps = {
  collectionId: string;
};

export function CollectionDetailScreen({ collectionId }: CollectionDetailScreenProps) {
  const {
    detail,
    isLoading,
    error,
    refetch,
    removeMutation,
    reorderMutation,
    moveMutation,
    copyMutation,
    updateItemMutation,
  } = useCollectionDetail(collectionId);
  const { collections } = useCollectionsOverview();
  const [reorderEnabled, setReorderEnabled] = useState(false);
  const [activeItem, setActiveItem] = useState<CollectionDesignItem | null>(null);

  const coverUrls = useMemo(() => {
    if (!detail) {
      return [];
    }
    return resolveCoverSources({
      customCoverUrl: detail.collection.cover_image_url,
      itemImageUrls: detail.items.map((item) => item.thumbnailUrl ?? item.imageUrl),
    });
  }, [detail]);

  if (isLoading) {
    return (
      <Screen>
        <LoadingIndicator label="Opening collection" />
      </Screen>
    );
  }

  if (error || !detail) {
    return (
      <Screen>
        <ErrorState
          title="Collection unavailable"
          message={
            error instanceof Error
              ? error.message
              : 'This collection may be private or no longer exists.'
          }
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  const { collection, items, isOwner } = detail;
  const privacy = collection.is_private ? 'Private' : 'Public';

  const persistOrder = (nextItems: CollectionDesignItem[]) => {
    void reorderMutation.mutateAsync(nextItems.map((item) => item.itemId)).catch((err) => {
      Alert.alert(
        'Reorder failed',
        err instanceof Error ? err.message : 'Could not save the new order.',
      );
    });
  };

  const moveItem = (item: CollectionDesignItem, delta: -1 | 1) => {
    const index = items.findIndex((entry) => entry.itemId === item.itemId);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= items.length) {
      return;
    }
    const next = items.slice();
    const removed = next.splice(index, 1)[0];
    if (!removed) {
      return;
    }
    next.splice(target, 0, removed);
    persistOrder(next);
  };

  return (
    <Screen padded={false} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CollectionCover urls={coverUrls} height={260} />

        <View style={styles.body}>
          <Text variant="label" tone="tertiary">
            {privacy}
            {collection.is_default ? ' · Default' : ''}
          </Text>
          <Text variant="heading">{collection.name}</Text>
          {collection.description ? (
            <Text variant="body" tone="secondary">
              {collection.description}
            </Text>
          ) : null}
          <Text variant="caption" tone="tertiary">
            {items.length} {items.length === 1 ? 'design' : 'designs'}
          </Text>

          {isOwner ? (
            <View style={styles.actions}>
              <Button
                label="Edit"
                variant="secondary"
                fullWidth={false}
                onPress={() => router.push(`/collection/${collection.id}/edit`)}
                style={styles.actionButton}
              />
              <Button
                label={reorderEnabled ? 'Done' : 'Reorder'}
                variant="secondary"
                fullWidth={false}
                onPress={() => setReorderEnabled((value) => !value)}
                style={styles.actionButton}
              />
              <Button
                label="Share"
                variant="ghost"
                fullWidth={false}
                onPress={async () => {
                  const result = await sharePublicCollection({
                    collectionId: collection.id,
                    name: collection.name,
                    isPrivate: collection.is_private,
                  });
                  if (result === 'blocked') {
                    Alert.alert(
                      'Private collection',
                      'Make this collection public before sharing a link.',
                    );
                  } else if (result === 'unavailable') {
                    Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
                  }
                }}
                style={styles.actionButton}
              />
            </View>
          ) : null}

          <CollectionSharingState
            isPrivate={collection.is_private}
            shareUrlPlaceholder={buildPublicCollectionShareUrl(collection.id)}
          />

          {items.length === 0 ? (
            <EmptyState
              label="Empty"
              title="No designs here yet"
              description="Save from Discover or move work from another collection."
            />
          ) : (
            <CollectionDesignGrid
              items={items}
              reorderEnabled={reorderEnabled && isOwner}
              onOpenDesign={(item) => {
                if (item.unavailable) {
                  setActiveItem(item);
                  return;
                }
                router.push(`/design/${item.designId}`);
              }}
              onLongPressItem={(item) => {
                if (isOwner) {
                  setActiveItem(item);
                }
              }}
              onMoveEarlier={(item) => moveItem(item, -1)}
              onMoveLater={(item) => moveItem(item, 1)}
            />
          )}
        </View>
      </ScrollView>

      <ItemActionsSheet
        visible={Boolean(activeItem)}
        item={activeItem}
        currentCollectionId={collection.id}
        collections={collections.map((entry) => ({ id: entry.id, name: entry.name }))}
        onClose={() => setActiveItem(null)}
        onRemove={async () => {
          if (!activeItem) {
            return;
          }
          await removeMutation.mutateAsync(activeItem.designId);
        }}
        onMove={async (toCollectionId) => {
          if (!activeItem) {
            return;
          }
          await moveMutation.mutateAsync({
            designId: activeItem.designId,
            toCollectionId,
          });
        }}
        onCopy={async (toCollectionId) => {
          if (!activeItem) {
            return;
          }
          await copyMutation.mutateAsync({
            designId: activeItem.designId,
            toCollectionId,
          });
        }}
        onSaveDetails={async ({ note, savedAspect }) => {
          if (!activeItem) {
            return;
          }
          await updateItemMutation.mutateAsync({
            designId: activeItem.designId,
            note,
            savedAspect,
          });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing['4xl'],
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    minWidth: 96,
  },
});
