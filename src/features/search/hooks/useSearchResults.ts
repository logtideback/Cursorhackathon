import NetInfo from '@react-native-community/netinfo';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_PAGE_SIZE,
  SEARCH_QUERY_KEY,
} from '@/features/search/constants';
import {
  mockSearchCreators,
  mockSearchDesigns,
  mockSearchTaxonomy,
  mockTrendingCategories,
} from '@/features/search/mock-search';
import { sanitizeSearchQuery } from '@/features/search/sanitize';
import { useSearchStore } from '@/features/search/store';
import type {
  SearchCreatorHit,
  SearchDesignHit,
  SearchPage,
  SearchTaxonomyHit,
} from '@/features/search/types';
import { trackEvent } from '@/lib/analytics/track';
import { isEnvConfigured } from '@/lib/env';
import {
  countSearchDesigns,
  fetchTrendingCategories,
  searchCreators,
  searchDesigns,
  searchTaxonomy,
} from '@/services/search';

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function useOfflineFlag(): boolean {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return unsubscribe;
  }, []);
  return offline;
}

export function useSearchLanding() {
  const useMock = !isEnvConfigured();
  const trendingQuery = useQuery({
    queryKey: [SEARCH_QUERY_KEY, 'trending'],
    queryFn: () => (useMock ? mockTrendingCategories() : fetchTrendingCategories(8)),
    staleTime: 5 * 60_000,
  });

  return {
    trending: trendingQuery.data ?? [],
    isLoading: trendingQuery.isLoading,
    error: trendingQuery.error,
    refetch: trendingQuery.refetch,
  };
}

export function useSearchResults() {
  const query = useSearchStore((s) => s.query);
  const resultType = useSearchStore((s) => s.resultType);
  const filters = useSearchStore((s) => s.appliedFilters);
  const debouncedQuery = useDebouncedValue(sanitizeSearchQuery(query), SEARCH_DEBOUNCE_MS);
  const offline = useOfflineFlag();
  const useMock = !isEnvConfigured();
  const requestIdRef = useRef(0);
  const [requestEpoch, setRequestEpoch] = useState(0);

  useEffect(() => {
    requestIdRef.current += 1;
    setRequestEpoch(requestIdRef.current);
    trackEvent('search_started', {
      query: debouncedQuery || null,
      result_type: resultType,
      filter_count: Object.values(filters).flat().length,
    });
  }, [debouncedQuery, resultType, filters]);

  const designsQuery = useInfiniteQuery({
    queryKey: [SEARCH_QUERY_KEY, 'designs', debouncedQuery, filters, requestEpoch],
    enabled: resultType === 'designs' && (!offline || useMock),
    initialPageParam: 0,
    staleTime: 30_000,
    queryFn: async ({ pageParam, signal }) => {
      const page = useMock
        ? mockSearchDesigns({
            query: debouncedQuery,
            filters,
            offset: pageParam,
            limit: SEARCH_PAGE_SIZE,
          })
        : await searchDesigns({
            query: debouncedQuery,
            filters,
            offset: pageParam,
            limit: SEARCH_PAGE_SIZE,
            signal,
          });
      if (pageParam === 0) {
        trackEvent('search_completed', {
          query: debouncedQuery || null,
          result_type: 'designs',
          result_count: page.totalCount,
        });
      }
      return page;
    },
    getNextPageParam: (lastPage: SearchPage<SearchDesignHit>) => lastPage.nextOffset ?? undefined,
  });

  const creatorsQuery = useInfiniteQuery({
    queryKey: [SEARCH_QUERY_KEY, 'creators', debouncedQuery, requestEpoch],
    enabled: resultType === 'creators' && (!offline || useMock),
    initialPageParam: 0,
    staleTime: 30_000,
    queryFn: async ({ pageParam, signal }) => {
      const page = useMock
        ? mockSearchCreators({
            query: debouncedQuery,
            offset: pageParam,
            limit: SEARCH_PAGE_SIZE,
          })
        : await searchCreators({
            query: debouncedQuery,
            offset: pageParam,
            limit: SEARCH_PAGE_SIZE,
            signal,
          });
      if (pageParam === 0) {
        trackEvent('search_completed', {
          query: debouncedQuery || null,
          result_type: 'creators',
          result_count: page.totalCount,
        });
      }
      return page;
    },
    getNextPageParam: (lastPage: SearchPage<SearchCreatorHit>) => lastPage.nextOffset ?? undefined,
  });

  const taxonomyKind =
    resultType === 'categories'
      ? 'category'
      : resultType === 'tags'
        ? 'tag'
        : resultType === 'industries'
          ? 'industry'
          : resultType === 'platforms'
            ? 'platform'
            : null;

  const taxonomyQuery = useQuery({
    queryKey: [SEARCH_QUERY_KEY, 'taxonomy', taxonomyKind, debouncedQuery, requestEpoch],
    enabled: Boolean(taxonomyKind) && (!offline || useMock),
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const items = useMock
        ? mockSearchTaxonomy({
            query: debouncedQuery,
            kind: taxonomyKind as 'category' | 'tag' | 'industry' | 'platform',
          })
        : await searchTaxonomy({
            query: debouncedQuery,
            kind: taxonomyKind as 'category' | 'tag' | 'industry' | 'platform',
            signal,
          });
      trackEvent('search_completed', {
        query: debouncedQuery || null,
        result_type: resultType,
        result_count: items.length,
      });
      return items;
    },
  });

  const designItems = useMemo(
    () => designsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [designsQuery.data],
  );
  const creatorItems = useMemo(
    () => creatorsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [creatorsQuery.data],
  );

  const totalCount =
    resultType === 'designs'
      ? (designsQuery.data?.pages[0]?.totalCount ?? 0)
      : resultType === 'creators'
        ? (creatorsQuery.data?.pages[0]?.totalCount ?? 0)
        : (taxonomyQuery.data?.length ?? 0);

  const isFetching =
    resultType === 'designs'
      ? designsQuery.isFetching
      : resultType === 'creators'
        ? creatorsQuery.isFetching
        : taxonomyQuery.isFetching;

  const isLoading =
    resultType === 'designs'
      ? designsQuery.isLoading
      : resultType === 'creators'
        ? creatorsQuery.isLoading
        : taxonomyQuery.isLoading;

  const isFetchingNextPage =
    resultType === 'designs'
      ? designsQuery.isFetchingNextPage
      : resultType === 'creators'
        ? creatorsQuery.isFetchingNextPage
        : false;

  const error =
    resultType === 'designs'
      ? designsQuery.error
      : resultType === 'creators'
        ? creatorsQuery.error
        : taxonomyQuery.error;

  const showPlaceholder =
    isLoading ||
    (isFetching &&
      designItems.length === 0 &&
      creatorItems.length === 0 &&
      !taxonomyQuery.data?.length);

  return {
    debouncedQuery,
    resultType,
    filters,
    offline,
    designItems,
    creatorItems,
    taxonomyItems: (taxonomyQuery.data ?? []) as SearchTaxonomyHit[],
    totalCount,
    isLoading,
    isFetching,
    isFetchingNextPage,
    showPlaceholder,
    error,
    fetchNextPage: () => {
      if (resultType === 'designs') {
        void designsQuery.fetchNextPage();
      } else if (resultType === 'creators') {
        void creatorsQuery.fetchNextPage();
      }
    },
    hasNextPage:
      resultType === 'designs'
        ? Boolean(designsQuery.hasNextPage)
        : resultType === 'creators'
          ? Boolean(creatorsQuery.hasNextPage)
          : false,
    refetch: () => {
      if (resultType === 'designs') {
        void designsQuery.refetch();
      } else if (resultType === 'creators') {
        void creatorsQuery.refetch();
      } else {
        void taxonomyQuery.refetch();
      }
    },
  };
}

export function useFilterPreviewCount() {
  const query = useSearchStore((s) => s.query);
  const filters = useSearchStore((s) => s.draftFilters);
  const debouncedQuery = useDebouncedValue(sanitizeSearchQuery(query), SEARCH_DEBOUNCE_MS);
  const useMock = !isEnvConfigured();

  return useQuery({
    queryKey: [SEARCH_QUERY_KEY, 'preview-count', debouncedQuery, filters],
    queryFn: async ({ signal }) => {
      if (useMock) {
        return mockSearchDesigns({ query: debouncedQuery, filters, limit: 1 }).totalCount;
      }
      return countSearchDesigns({ query: debouncedQuery, filters, signal });
    },
    staleTime: 15_000,
  });
}
