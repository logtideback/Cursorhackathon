import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { LoadingIndicator, Screen, Text } from '@/components';
import { RecentSearches } from '@/features/search/components/RecentSearches';
import { SearchBar } from '@/features/search/components/SearchBar';
import { SuggestedSearches } from '@/features/search/components/SuggestedSearches';
import { TrendingCategories } from '@/features/search/components/TrendingCategories';
import { useSearchLanding } from '@/features/search/hooks/useSearchResults';
import {
  clearRecentSearches,
  loadRecentSearches,
  saveRecentSearch,
} from '@/features/search/recent-searches';
import { useSearchStore } from '@/features/search/store';
import type { RecentSearchEntry, TrendingCategory } from '@/features/search/types';
import { trackEvent } from '@/lib/analytics/track';
import { spacing } from '@/theme';

export function SearchLandingScreen() {
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const setResultType = useSearchStore((s) => s.setResultType);
  const clearFilterKey = useSearchStore((s) => s.clearFilterKey);
  const { trending, isLoading } = useSearchLanding();
  const [recent, setRecent] = useState<RecentSearchEntry[]>([]);

  useEffect(() => {
    void loadRecentSearches().then(setRecent);
  }, []);

  const openResults = useCallback(
    async (nextQuery: string) => {
      setQuery(nextQuery);
      const updated = await saveRecentSearch({ query: nextQuery, resultType: 'designs' });
      setRecent(updated);
      router.push('/(tabs)/search/results');
    },
    [setQuery],
  );

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text variant="label" tone="tertiary">
            Search
          </Text>
          <Text variant="heading">Find designs</Text>
          <Text variant="body" tone="secondary">
            Search designs, creators, categories, tags, industries, and platforms.
          </Text>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={() => {
            void openResults(query);
          }}
          onClear={() => setQuery('')}
          autoFocus={false}
        />

        <RecentSearches
          entries={recent}
          onSelect={(entry) => {
            setResultType(entry.resultType);
            trackEvent('recent_search_selected', { query: entry.query });
            void openResults(entry.query);
          }}
          onClearAll={() => {
            void clearRecentSearches().then(() => setRecent([]));
          }}
        />

        <SuggestedSearches
          onSelect={(suggested) => {
            setResultType('designs');
            void openResults(suggested);
          }}
        />

        {isLoading ? <LoadingIndicator label="Loading trends" /> : null}

        <TrendingCategories
          categories={trending}
          onSelect={(category: TrendingCategory) => {
            setResultType('designs');
            clearFilterKey({ categories: [category.slug] });
            void openResults(category.name);
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing['2xl'],
  },
  header: {
    gap: spacing.sm,
  },
});
