import { describe, expect, it } from 'vitest';

import { EMPTY_SEARCH_FILTERS } from '@/features/search/constants';
import { buildActiveFilterChips } from '@/features/search/filter-chips';
import { isBlankQuery, sanitizeSearchQuery } from '@/features/search/sanitize';
import { countActiveFilters } from '@/features/search/types';

describe('sanitizeSearchQuery', () => {
  it('trims and bounds length', () => {
    expect(sanitizeSearchQuery('  editorial typography  ')).toBe('editorial typography');
    expect(sanitizeSearchQuery('a'.repeat(200)).length).toBe(100);
  });

  it('strips control characters', () => {
    expect(sanitizeSearchQuery('hello\u0000world')).toBe('hello world');
  });

  it('detects blank queries', () => {
    expect(isBlankQuery('   ')).toBe(true);
    expect(isBlankQuery('taste')).toBe(false);
  });
});

describe('countActiveFilters', () => {
  it('counts non-default filter groups', () => {
    expect(countActiveFilters(EMPTY_SEARCH_FILTERS)).toBe(0);
    expect(
      countActiveFilters({
        ...EMPTY_SEARCH_FILTERS,
        categories: ['editorial'],
        provenances: ['original_work'],
        sort: 'newest',
      }),
    ).toBe(3);
  });
});

describe('buildActiveFilterChips', () => {
  it('builds clearable chips', () => {
    const chips = buildActiveFilterChips({
      ...EMPTY_SEARCH_FILTERS,
      styles: ['minimal'],
      dateAdded: '7d',
    });
    expect(chips.map((chip) => chip.key)).toEqual(['style:minimal', 'date:7d']);
  });
});
