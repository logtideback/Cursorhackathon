import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Button, EmptyState, ErrorState, LoadingIndicator, Screen, Text } from '@/components';
import { CollectionListItem } from '@/features/collections/components/CollectionListItem';
import { useCollectionsOverview } from '@/features/collections/hooks/useCollectionsOverview';
import { colors, spacing } from '@/theme';

export function CollectionsOverviewScreen() {
  const { collections, isLoading, isRefreshing, error, refetch } = useCollectionsOverview();

  if (isLoading) {
    return (
      <Screen>
        <LoadingIndicator label="Loading collections" />
      </Screen>
    );
  }

  if (error && collections.length === 0) {
    return (
      <Screen>
        <ErrorState
          title="Couldn’t load collections"
          message={error instanceof Error ? error.message : 'Something went wrong.'}
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refetch()}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="label" tone="tertiary">
            Collections
          </Text>
          <Text variant="heading">Saved</Text>
          <Text variant="body" tone="secondary">
            Default Saved stays first. Build quieter boards around the work you keep returning to.
          </Text>
          <Button
            label="New collection"
            fullWidth={false}
            onPress={() => router.push('/collection/create')}
            style={styles.create}
          />
        </View>

        {collections.length === 0 ? (
          <EmptyState
            label="Empty"
            title="Nothing saved yet"
            description="Swipe right on Discover to fill your default Saved collection. New boards start here."
            actionLabel="Go to Discover"
            onAction={() => router.push('/(tabs)')}
          />
        ) : (
          collections.map((collection) => (
            <CollectionListItem
              key={collection.id}
              collection={collection}
              onPress={() => router.push(`/collection/${collection.id}`)}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  create: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    minWidth: 160,
  },
});
