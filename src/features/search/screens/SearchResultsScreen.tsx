import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Button, EmptyState, ErrorState, OfflineBanner, Screen, Text } from '@/components';
import { ActiveFilterChips } from '@/features/search/components/ActiveFilterChips';
import { CreatorResultsList } from '@/features/search/components/CreatorResultsList';
import { DesignQuickActionsSheet } from '@/features/search/components/DesignQuickActionsSheet';
import { DesignResultsGrid } from '@/features/search/components/DesignResultsGrid';
import { ResultTypeTabs } from '@/features/search/components/ResultTypeTabs';
import { SearchBar } from '@/features/search/components/SearchBar';
import { SearchSkeleton } from '@/features/search/components/SearchSkeleton';
import { TaxonomyResultsList } from '@/features/search/components/TaxonomyResultsList';
import { buildActiveFilterChips } from '@/features/search/filter-chips';
import { useSearchResults } from '@/features/search/hooks/useSearchResults';
import { saveRecentSearch } from '@/features/search/recent-searches';
import { useSearchStore } from '@/features/search/store';
import type { SearchDesignHit, SearchTaxonomyHit } from '@/features/search/types';
import { track } from '@/lib/analytics';
import { isEnvConfigured } from '@/lib/env';
import { colors, spacing } from '@/theme';

export function SearchResultsScreen() {
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const resultType = useSearchStore((s) => s.resultType);
  const setResultType = useSearchStore((s) => s.setResultType);
  const appliedFilters = useSearchStore((s) => s.appliedFilters);
  const clearFilterKey = useSearchStore((s) => s.clearFilterKey);
  const clearCreator = useSearchStore((s) => s.clearCreator);
  const clearAllFilters = useSearchStore((s) => s.clearAllFilters);
  const activeFilterCount = useSearchStore((s) => s.activeFilterCount);
  const resetDraftFromApplied = useSearchStore((s) => s.resetDraftFromApplied);

  const {
    designItems,
    creatorItems,
    taxonomyItems,
    totalCount,
    isLoading,
    isFetching,
    isFetchingNextPage,
    showPlaceholder,
    offline,
    error,
    fetchNextPage,
    hasNextPage,
    refetch,
    debouncedQuery,
  } = useSearchResults();

  const [quickItem, setQuickItem] = useState<SearchDesignHit | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  useEffect(() => {
    if (debouncedQuery) {
      void saveRecentSearch({ query: debouncedQuery, resultType });
    }
  }, [debouncedQuery, resultType]);

  const chips = useMemo(() => buildActiveFilterChips(appliedFilters), [appliedFilters]);
  const visibleDesigns = designItems.filter((item) => !hiddenIds.includes(item.id));

  const openFilters = () => {
    resetDraftFromApplied();
    router.push('/(tabs)/search/filters');
  };

  const applyTaxonomy = (item: SearchTaxonomyHit) => {
    if (item.kind === 'category') {
      clearFilterKey({ categories: [item.slug] });
      setResultType('designs');
      setQuery(item.label);
    } else if (item.kind === 'tag') {
      clearFilterKey({ styles: [item.slug] });
      setResultType('designs');
      setQuery(item.label);
    } else if (item.kind === 'industry') {
      clearFilterKey({ industries: [item.slug] });
      setResultType('designs');
      setQuery(item.label);
    } else if (item.kind === 'platform') {
      clearFilterKey({ platforms: [item.slug] });
      setResultType('designs');
      setQuery(item.label);
    }
  };

  const footer =
    resultType === 'designs' ? (
      <View style={styles.footer}>
        {isFetchingNextPage ? <ActivityIndicator color={colors.accent} /> : null}
        {hasNextPage && !isFetchingNextPage ? (
          <Button label="Load more" variant="ghost" onPress={() => void fetchNextPage()} />
        ) : null}
      </View>
    ) : null;

  return (
    <Screen padded={false} edges={['top', 'left', 'right']} keyboardAvoiding>
      <View style={styles.top}>
        <SearchBar value={query} onChangeText={setQuery} onClear={() => setQuery('')} autoFocus />
        <View style={styles.toolbar}>
          <Button
            label={`Filters${activeFilterCount() ? ` · ${activeFilterCount()}` : ''}`}
            variant="secondary"
            fullWidth={false}
            onPress={openFilters}
            style={styles.filterButton}
          />
          <Text variant="caption" tone="secondary">
            {isFetching && !isLoading ? 'Updating…' : `${totalCount} results`}
          </Text>
        </View>
        <ResultTypeTabs value={resultType} onChange={setResultType} />
        <ActiveFilterChips
          chips={chips}
          onClearChip={(chip) => {
            if (chip.clear === 'creator') {
              clearCreator();
            } else if (chip.clear !== 'all') {
              clearFilterKey(chip.clear);
            }
            track({
              name: 'filter_applied',
              properties: {
                filterKey: chip.key,
                activeFilterCount: activeFilterCount(),
                action: 'clear',
              },
            });
          }}
          onClearAll={() => {
            clearAllFilters();
            track({
              name: 'filter_applied',
              properties: {
                filterKey: 'all',
                activeFilterCount: 0,
                action: 'clear_all',
              },
            });
          }}
        />
      </View>

      {offline ? (
        <View style={styles.offlineWrap}>
          <OfflineBanner
            message={
              isEnvConfigured()
                ? 'Connect to refresh remote search results.'
                : 'Offline preview — using local search fixtures.'
            }
            actionLabel="Retry"
            onAction={() => void refetch()}
          />
        </View>
      ) : null}

      {showPlaceholder ? (
        <View style={styles.padded}>
          <SearchSkeleton variant={resultType === 'designs' ? 'grid' : 'rows'} />
        </View>
      ) : null}

      {error && !showPlaceholder ? (
        <View style={styles.padded}>
          <ErrorState
            title="Search failed"
            message={error instanceof Error ? error.message : 'Could not complete that search.'}
            onAction={() => void refetch()}
          />
        </View>
      ) : null}

      {!showPlaceholder && !error && resultType === 'designs' && visibleDesigns.length === 0 ? (
        <View style={styles.padded}>
          <EmptyState
            label="No results"
            title="Nothing matched"
            description="Try a broader query, or clear one of the active filters."
            actionLabel="Clear filters"
            onAction={clearAllFilters}
          />
        </View>
      ) : null}

      {!showPlaceholder && !error && resultType === 'designs' && visibleDesigns.length > 0 ? (
        <View style={styles.list}>
          <DesignResultsGrid
            items={visibleDesigns}
            onPress={(item) => {
              track({
                name: 'search_result_opened',
                properties: {
                  resultType: 'design',
                  resultId: item.id,
                },
              });
              router.push(`/design/${item.id}`);
            }}
            onLongPress={setQuickItem}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                void fetchNextPage();
              }
            }}
            ListFooterComponent={footer}
          />
        </View>
      ) : null}

      {!showPlaceholder && resultType !== 'designs' ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {resultType === 'creators' && creatorItems.length === 0 ? (
            <EmptyState
              label="No results"
              title="No creators found"
              description="Try another name or username."
            />
          ) : null}

          {resultType === 'creators' ? (
            <CreatorResultsList
              items={creatorItems}
              onPress={(item) => {
                track({
                  name: 'search_result_opened',
                  properties: {
                    resultType: 'creator',
                    resultId: item.id,
                  },
                });
                router.push(`/creator/${item.id}`);
              }}
              onFilterToCreator={(item) => {
                clearFilterKey({
                  creatorId: item.id,
                  creatorLabel: item.displayName ?? item.username ?? 'Creator',
                });
                setResultType('designs');
                track({
                  name: 'filter_applied',
                  properties: {
                    filterKey: 'creator',
                    activeFilterCount: activeFilterCount() + 1,
                    action: 'apply',
                  },
                });
              }}
            />
          ) : null}

          {resultType !== 'creators' && taxonomyItems.length === 0 ? (
            <EmptyState
              label="No results"
              title="No matches"
              description="Try a shorter term or browse trending categories from Search."
            />
          ) : null}

          {resultType !== 'creators' ? (
            <TaxonomyResultsList items={taxonomyItems} onPress={applyTaxonomy} />
          ) : null}
        </ScrollView>
      ) : null}

      <DesignQuickActionsSheet
        visible={Boolean(quickItem)}
        item={quickItem}
        onClose={() => setQuickItem(null)}
        onRemovedFromResults={(id) => setHiddenIds((current) => [...current, id])}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  filterButton: {
    minWidth: 120,
  },
  padded: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  offlineWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.lg,
  },
  footer: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
});
