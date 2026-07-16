import { create } from 'zustand';

import {
  EMPTY_SEARCH_FILTERS,
  type SearchFilters,
  type SearchResultType,
} from '@/features/search/constants';
import { countActiveFilters } from '@/features/search/types';

type SearchStore = {
  query: string;
  resultType: SearchResultType;
  appliedFilters: SearchFilters;
  draftFilters: SearchFilters;
  setQuery: (query: string) => void;
  setResultType: (resultType: SearchResultType) => void;
  setDraftFilters: (filters: SearchFilters | ((current: SearchFilters) => SearchFilters)) => void;
  applyDraftFilters: () => void;
  resetDraftFromApplied: () => void;
  clearFilterKey: (patch: Partial<SearchFilters>) => void;
  clearCreator: () => void;
  clearAllFilters: () => void;
  activeFilterCount: () => number;
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: '',
  resultType: 'designs',
  appliedFilters: EMPTY_SEARCH_FILTERS,
  draftFilters: EMPTY_SEARCH_FILTERS,
  setQuery: (query) => set({ query }),
  setResultType: (resultType) => set({ resultType }),
  setDraftFilters: (filters) =>
    set((state) => ({
      draftFilters: typeof filters === 'function' ? filters(state.draftFilters) : filters,
    })),
  applyDraftFilters: () => set((state) => ({ appliedFilters: state.draftFilters })),
  resetDraftFromApplied: () => set((state) => ({ draftFilters: state.appliedFilters })),
  clearFilterKey: (patch) =>
    set((state) => ({
      appliedFilters: { ...state.appliedFilters, ...patch },
      draftFilters: { ...state.draftFilters, ...patch },
    })),
  clearCreator: () =>
    set((state) => ({
      appliedFilters: {
        ...state.appliedFilters,
        creatorId: null,
        creatorLabel: null,
      },
      draftFilters: {
        ...state.draftFilters,
        creatorId: null,
        creatorLabel: null,
      },
    })),
  clearAllFilters: () =>
    set({
      appliedFilters: EMPTY_SEARCH_FILTERS,
      draftFilters: EMPTY_SEARCH_FILTERS,
    }),
  activeFilterCount: () => countActiveFilters(get().appliedFilters),
}));
