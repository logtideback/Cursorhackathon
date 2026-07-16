import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  RECENT_SEARCHES_KEY,
  RECENT_SEARCHES_LIMIT,
  type SearchResultType,
} from '@/features/search/constants';
import { sanitizeSearchQuery } from '@/features/search/sanitize';
import type { RecentSearchEntry } from '@/features/search/types';

export async function loadRecentSearches(): Promise<RecentSearchEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as RecentSearchEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_SEARCHES_LIMIT) : [];
  } catch {
    return [];
  }
}

export async function saveRecentSearch(params: {
  query: string;
  resultType?: SearchResultType;
}): Promise<RecentSearchEntry[]> {
  const query = sanitizeSearchQuery(params.query);
  if (!query) {
    return loadRecentSearches();
  }

  const existing = await loadRecentSearches();
  const nextEntry: RecentSearchEntry = {
    id: `${Date.now()}-${query}`,
    query,
    resultType: params.resultType ?? 'designs',
    createdAt: new Date().toISOString(),
  };
  const deduped = [
    nextEntry,
    ...existing.filter((entry) => entry.query.toLowerCase() !== query.toLowerCase()),
  ].slice(0, RECENT_SEARCHES_LIMIT);

  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(deduped));
  return deduped;
}

export async function clearRecentSearches(): Promise<void> {
  await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
}
