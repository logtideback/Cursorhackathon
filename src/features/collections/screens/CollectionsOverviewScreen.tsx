import NetInfo from '@react-native-community/netinfo';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, EmptyState, ErrorState, OfflineBanner, Screen, Text } from '@/components';
import { CollectionListItem } from '@/features/collections/components/CollectionListItem';
import { CollectionsSkeleton } from '@/features/collections/components/CollectionsSkeleton';
import { useCollectionsOverview } from '@/features/collections/hooks/useCollectionsOverview';
import { spacing } from '@/theme';

export function CollectionsOverviewScreen() {
  const { collections, isLoading, isRefreshing, error, refetch } = useCollectionsOverview();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return () => sub();
  }, []);

  if (isLoading) {
    return (
      <Screen padded={false}>
        <CollectionsSkeleton variant="overview" />
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
      <FlashList
        data={collections}
        keyExtractor={(item) => item.id}
        refreshing={isRefreshing}
        onRefresh={() => void refetch()}
        style={styles.list}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            {offline ? (
              <OfflineBanner
                message="Showing the last collections we could load."
                actionLabel="Retry"
                onAction={() => void refetch()}
              />
            ) : null}
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
        }
        ListEmptyComponent={
          <EmptyState
            label="Empty"
            title="Nothing saved yet"
            description="Swipe right on Discover to fill your default Saved collection. New boards start here."
            actionLabel="Go to Discover"
            onAction={() => router.push('/(tabs)')}
          />
        }
        renderItem={({ item }) => (
          <CollectionListItem
            collection={item}
            onPress={() => router.push(`/collection/${item.id}`)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
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
