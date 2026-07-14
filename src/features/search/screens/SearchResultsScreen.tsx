import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Button, EmptyState, ErrorState, Screen, Text } from '@/components';
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

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
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

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onScrollEndDrag={() => {
          if (hasNextPage) {
            fetchNextPage();
          }
        }}
      >
        {offline ? (
          <Text variant="caption" tone="secondary" style={styles.banner}>
            {isEnvConfigured()
              ? 'You’re offline. Connect to refresh remote search results.'
              : 'Offline preview mode — using local search fixtures.'}
          </Text>
        ) : null}

        {error && !showPlaceholder ? (
          <ErrorState
            title="Search failed"
            message={error instanceof Error ? error.message : 'Could not complete that search.'}
            onAction={() => void refetch()}
          />
        ) : null}

        {showPlaceholder ? (
          <SearchSkeleton variant={resultType === 'designs' ? 'grid' : 'rows'} />
        ) : null}

        {!showPlaceholder && !error && resultType === 'designs' && visibleDesigns.length === 0 ? (
          <EmptyState
            label="No results"
            title="Nothing matched"
            description="Try a broader query, or clear one of the active filters."
            actionLabel="Clear filters"
            onAction={clearAllFilters}
          />
        ) : null}

        {!showPlaceholder && resultType === 'designs' ? (
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
          />
        ) : null}

        {!showPlaceholder && resultType === 'creators' && creatorItems.length === 0 ? (
          <EmptyState
            label="No results"
            title="No creators found"
            description="Try another name or username."
          />
        ) : null}

        {!showPlaceholder && resultType === 'creators' ? (
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

        {!showPlaceholder &&
        resultType !== 'designs' &&
        resultType !== 'creators' &&
        taxonomyItems.length === 0 ? (
          <EmptyState
            label="No results"
            title="No matches"
            description="Try a shorter term or browse trending categories from Search."
          />
        ) : null}

        {!showPlaceholder && resultType !== 'designs' && resultType !== 'creators' ? (
          <TaxonomyResultsList items={taxonomyItems} onPress={applyTaxonomy} />
        ) : null}

        {isFetchingNextPage ? (
          <ActivityIndicator color={colors.accent} style={styles.more} />
        ) : null}

        {hasNextPage && !isFetchingNextPage ? (
          <Button label="Load more" variant="ghost" onPress={fetchNextPage} />
        ) : null}
      </ScrollView>

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
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.lg,
  },
  banner: {
    marginBottom: -spacing.sm,
  },
  more: {
    marginVertical: spacing.lg,
  },
});
