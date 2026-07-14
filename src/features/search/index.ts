import {
  countSearchDesigns,
  fetchTrendingCategories,
  searchCreators,
  searchDesigns,
  searchTaxonomy,
} from '@/services/search';

export { EMPTY_SEARCH_FILTERS, SEARCH_QUERY_KEY, SUGGESTED_SEARCHES } from './constants';
export type { SearchFilters, SearchResultType } from './constants';
export { buildActiveFilterChips } from './filter-chips';
export { sanitizeSearchQuery } from './sanitize';
export { SearchFiltersScreen } from './screens/SearchFiltersScreen';
export { SearchLandingScreen } from './screens/SearchLandingScreen';
export { SearchResultsScreen } from './screens/SearchResultsScreen';
export { useSearchStore } from './store';

export const searchApi = {
  searchDesigns,
  searchCreators,
  searchTaxonomy,
  fetchTrendingCategories,
  countSearchDesigns,
};

export type SearchFeature = 'search';
