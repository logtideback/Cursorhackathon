import type { DesignProvenance } from '@/types/database';

export const SEARCH_QUERY_KEY = 'search' as const;
export const SEARCH_DEBOUNCE_MS = 320;
export const SEARCH_PAGE_SIZE = 24;
export const RECENT_SEARCHES_KEY = 'taste:recent-searches:v1';
export const RECENT_SEARCHES_LIMIT = 12;
export const QUERY_MAX_LENGTH = 100;

export type SearchResultType =
  'designs' | 'creators' | 'categories' | 'tags' | 'industries' | 'platforms';

export type DateAddedFilter = 'any' | '7d' | '30d' | '90d' | 'year';
export type PopularityFilter = 'any' | 'popular' | 'rising';
export type SavedStatusFilter = 'any' | 'saved' | 'unsaved';
export type SearchSort = 'relevance' | 'newest' | 'popular';

export type SearchFilters = {
  categories: string[];
  styles: string[];
  platforms: string[];
  industries: string[];
  colourFamilies: string[];
  provenances: DesignProvenance[];
  creatorId: string | null;
  creatorLabel: string | null;
  dateAdded: DateAddedFilter;
  popularity: PopularityFilter;
  savedStatus: SavedStatusFilter;
  sort: SearchSort;
};

export const EMPTY_SEARCH_FILTERS: SearchFilters = {
  categories: [],
  styles: [],
  platforms: [],
  industries: [],
  colourFamilies: [],
  provenances: [],
  creatorId: null,
  creatorLabel: null,
  dateAdded: 'any',
  popularity: 'any',
  savedStatus: 'any',
  sort: 'relevance',
};

export const DATE_ADDED_OPTIONS: { value: DateAddedFilter; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: '7d', label: 'Past 7 days' },
  { value: '30d', label: 'Past 30 days' },
  { value: '90d', label: 'Past 90 days' },
  { value: 'year', label: 'Past year' },
];

export const POPULARITY_OPTIONS: { value: PopularityFilter; label: string }[] = [
  { value: 'any', label: 'Any popularity' },
  { value: 'popular', label: 'Popular' },
  { value: 'rising', label: 'Rising' },
];

export const SAVED_STATUS_OPTIONS: { value: SavedStatusFilter; label: string }[] = [
  { value: 'any', label: 'Saved or not' },
  { value: 'saved', label: 'Already saved' },
  { value: 'unsaved', label: 'Not saved yet' },
];

export const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most saved' },
];

export const SUGGESTED_SEARCHES = [
  'Editorial typography',
  'Mobile onboarding',
  'Dashboard layout',
  'Swiss grid',
  'Fintech branding',
  'Watch complications',
] as const;

export const RESULT_TYPE_LABELS: Record<SearchResultType, string> = {
  designs: 'Designs',
  creators: 'Creators',
  categories: 'Categories',
  tags: 'Tags',
  industries: 'Industries',
  platforms: 'Platforms',
};
