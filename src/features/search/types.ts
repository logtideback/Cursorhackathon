import type {
  DateAddedFilter,
  SearchFilters,
  SearchResultType,
  SearchSort,
} from '@/features/search/constants';
import type { DesignProvenance } from '@/types/database';

export type SearchDesignHit = {
  id: string;
  title: string;
  description: string | null;
  creatorId: string;
  creatorName: string;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  platform: string | null;
  industry: string | null;
  provenance: DesignProvenance;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  tags: string[];
  saveCount: number;
  createdAt: string;
  rank: number;
};

export type SearchCreatorHit = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  publishedDesignCount: number;
  rank: number;
};

export type SearchTaxonomyHit = {
  kind: 'category' | 'tag' | 'industry' | 'platform';
  id: string;
  label: string;
  slug: string;
  meta: string | null;
};

export type TrendingCategory = {
  id: string;
  name: string;
  slug: string;
  designCount: number;
};

export type SearchPage<T> = {
  items: T[];
  totalCount: number;
  nextOffset: number | null;
};

export type ActiveFilterChip = {
  key: string;
  label: string;
  clear: Partial<SearchFilters> | 'creator' | 'all';
};

export type RecentSearchEntry = {
  id: string;
  query: string;
  resultType: SearchResultType;
  createdAt: string;
};

export type SearchRequestInput = {
  query: string;
  filters: SearchFilters;
  resultType: SearchResultType;
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
};

export function dateAddedToRange(value: DateAddedFilter): {
  from: string | null;
  to: string | null;
} {
  if (value === 'any') {
    return { from: null, to: null };
  }
  const now = Date.now();
  const days =
    value === '7d' ? 7 : value === '30d' ? 30 : value === '90d' ? 90 : value === 'year' ? 365 : 0;
  return {
    from: new Date(now - days * 24 * 60 * 60 * 1000).toISOString(),
    to: null,
  };
}

export function countActiveFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.categories.length) count += 1;
  if (filters.styles.length) count += 1;
  if (filters.platforms.length) count += 1;
  if (filters.industries.length) count += 1;
  if (filters.colourFamilies.length) count += 1;
  if (filters.provenances.length) count += 1;
  if (filters.creatorId) count += 1;
  if (filters.dateAdded !== 'any') count += 1;
  if (filters.popularity !== 'any') count += 1;
  if (filters.savedStatus !== 'any') count += 1;
  if (filters.sort !== 'relevance') count += 1;
  return count;
}

export type { SearchSort };
