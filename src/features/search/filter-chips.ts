import { PROVENANCE_LABELS } from '@/features/designs/detail/constants';
import {
  COLOUR_FAMILIES,
  DESIGN_STYLES,
  INDUSTRIES,
  PLATFORMS,
} from '@/features/onboarding/constants';
import {
  DATE_ADDED_OPTIONS,
  POPULARITY_OPTIONS,
  SAVED_STATUS_OPTIONS,
  SORT_OPTIONS,
  type SearchFilters,
} from '@/features/search/constants';
import type { ActiveFilterChip } from '@/features/search/types';

function labelFor(id: string, options: { id: string; label: string }[]): string {
  return options.find((option) => option.id === id)?.label ?? id;
}

export function buildActiveFilterChips(filters: SearchFilters): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  filters.categories.forEach((slug) => {
    chips.push({
      key: `category:${slug}`,
      label: slug.replace(/-/g, ' '),
      clear: { categories: filters.categories.filter((item) => item !== slug) },
    });
  });

  filters.styles.forEach((slug) => {
    chips.push({
      key: `style:${slug}`,
      label: labelFor(slug, DESIGN_STYLES),
      clear: { styles: filters.styles.filter((item) => item !== slug) },
    });
  });

  filters.platforms.forEach((id) => {
    chips.push({
      key: `platform:${id}`,
      label: labelFor(id, PLATFORMS),
      clear: { platforms: filters.platforms.filter((item) => item !== id) },
    });
  });

  filters.industries.forEach((id) => {
    chips.push({
      key: `industry:${id}`,
      label: labelFor(id, INDUSTRIES),
      clear: { industries: filters.industries.filter((item) => item !== id) },
    });
  });

  filters.colourFamilies.forEach((id) => {
    chips.push({
      key: `colour:${id}`,
      label: labelFor(id, COLOUR_FAMILIES),
      clear: { colourFamilies: filters.colourFamilies.filter((item) => item !== id) },
    });
  });

  filters.provenances.forEach((value) => {
    chips.push({
      key: `provenance:${value}`,
      label: PROVENANCE_LABELS[value],
      clear: { provenances: filters.provenances.filter((item) => item !== value) },
    });
  });

  if (filters.creatorId) {
    chips.push({
      key: `creator:${filters.creatorId}`,
      label: filters.creatorLabel ?? 'Creator',
      clear: 'creator',
    });
  }

  if (filters.dateAdded !== 'any') {
    chips.push({
      key: `date:${filters.dateAdded}`,
      label:
        DATE_ADDED_OPTIONS.find((option) => option.value === filters.dateAdded)?.label ?? 'Date',
      clear: { dateAdded: 'any' },
    });
  }

  if (filters.popularity !== 'any') {
    chips.push({
      key: `popularity:${filters.popularity}`,
      label:
        POPULARITY_OPTIONS.find((option) => option.value === filters.popularity)?.label ??
        'Popularity',
      clear: { popularity: 'any' },
    });
  }

  if (filters.savedStatus !== 'any') {
    chips.push({
      key: `saved:${filters.savedStatus}`,
      label:
        SAVED_STATUS_OPTIONS.find((option) => option.value === filters.savedStatus)?.label ??
        'Saved',
      clear: { savedStatus: 'any' },
    });
  }

  if (filters.sort !== 'relevance') {
    chips.push({
      key: `sort:${filters.sort}`,
      label: SORT_OPTIONS.find((option) => option.value === filters.sort)?.label ?? 'Sort',
      clear: { sort: 'relevance' },
    });
  }

  return chips;
}
