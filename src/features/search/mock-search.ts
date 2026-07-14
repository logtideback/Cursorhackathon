import { getMockDiscoverCards } from '@/features/discover/data/mock-designs';
import type { SearchFilters } from '@/features/search/constants';
import { sanitizeSearchQuery } from '@/features/search/sanitize';
import type {
  SearchCreatorHit,
  SearchDesignHit,
  SearchPage,
  SearchTaxonomyHit,
  TrendingCategory,
} from '@/features/search/types';
import type { DesignProvenance } from '@/types/database';

const MOCK_CREATORS: SearchCreatorHit[] = [
  {
    id: 'creator-aria',
    username: 'aria.form',
    displayName: 'Aria Form',
    avatarUrl: null,
    bio: 'Fintech product systems.',
    publishedDesignCount: 24,
    rank: 1,
  },
  {
    id: 'creator-june',
    username: 'june.atelier',
    displayName: 'June Atelier',
    avatarUrl: null,
    bio: 'Editorial type and covers.',
    publishedDesignCount: 11,
    rank: 0.8,
  },
  {
    id: 'creator-milo',
    username: 'milo.north',
    displayName: 'Milo North',
    avatarUrl: null,
    bio: 'Mobile onboarding craft.',
    publishedDesignCount: 18,
    rank: 0.7,
  },
];

function matchesQuery(haystack: string, query: string): boolean {
  if (!query) {
    return true;
  }
  return haystack.toLowerCase().includes(query.toLowerCase());
}

function designHits(): SearchDesignHit[] {
  return getMockDiscoverCards(20).map((card, index) => ({
    id: card.id,
    title: card.title,
    description: card.description,
    creatorId: card.creatorId,
    creatorName: card.creatorName,
    creatorUsername: card.creatorUsername,
    creatorAvatarUrl: null,
    categoryName: card.category,
    categorySlug: card.category?.toLowerCase().replace(/\s+/g, '-') ?? null,
    platform: card.platform,
    industry: index % 2 === 0 ? 'Fintech' : 'Media',
    provenance: (['original_work', 'concept', 'client_work', 'redesign', 'ai_assisted'] as const)[
      index % 5
    ] as DesignProvenance,
    imageUrl: card.imageUrl,
    thumbnailUrl: card.thumbnailUrl,
    tags: card.tags,
    saveCount: card.saveCount,
    createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
    rank: 1 - index * 0.05,
  }));
}

export function mockSearchDesigns(params: {
  query: string;
  filters: SearchFilters;
  offset?: number;
  limit?: number;
}): SearchPage<SearchDesignHit> {
  const query = sanitizeSearchQuery(params.query);
  const limit = params.limit ?? 24;
  const offset = params.offset ?? 0;
  let items = designHits().filter((item) =>
    matchesQuery(
      `${item.title} ${item.description ?? ''} ${item.tags.join(' ')} ${item.categoryName ?? ''}`,
      query,
    ),
  );

  if (params.filters.categories.length) {
    items = items.filter((item) =>
      params.filters.categories.some((slug) => item.categorySlug === slug),
    );
  }
  if (params.filters.platforms.length) {
    items = items.filter((item) =>
      params.filters.platforms.some(
        (platform) => item.platform?.toLowerCase() === platform.toLowerCase(),
      ),
    );
  }
  if (params.filters.industries.length) {
    items = items.filter((item) =>
      params.filters.industries.some(
        (industry) => item.industry?.toLowerCase() === industry.toLowerCase(),
      ),
    );
  }
  if (params.filters.provenances.length) {
    items = items.filter((item) => params.filters.provenances.includes(item.provenance));
  }
  if (params.filters.creatorId) {
    items = items.filter((item) => item.creatorId === params.filters.creatorId);
  }
  if (params.filters.popularity === 'popular') {
    items = items.filter((item) => item.saveCount >= 100);
  }
  if (params.filters.sort === 'popular') {
    items = items.slice().sort((a, b) => b.saveCount - a.saveCount);
  } else if (params.filters.sort === 'newest') {
    items = items.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const page = items.slice(offset, offset + limit);
  return {
    items: page,
    totalCount: items.length,
    nextOffset: offset + page.length < items.length ? offset + page.length : null,
  };
}

export function mockSearchCreators(params: {
  query: string;
  offset?: number;
  limit?: number;
}): SearchPage<SearchCreatorHit> {
  const query = sanitizeSearchQuery(params.query);
  const limit = params.limit ?? 24;
  const offset = params.offset ?? 0;
  const items = MOCK_CREATORS.filter((creator) =>
    matchesQuery(
      `${creator.displayName ?? ''} ${creator.username ?? ''} ${creator.bio ?? ''}`,
      query,
    ),
  );
  const page = items.slice(offset, offset + limit);
  return {
    items: page,
    totalCount: items.length,
    nextOffset: offset + page.length < items.length ? offset + page.length : null,
  };
}

export function mockSearchTaxonomy(params: {
  query: string;
  kind?: 'all' | 'category' | 'tag' | 'industry' | 'platform';
}): SearchTaxonomyHit[] {
  const query = sanitizeSearchQuery(params.query);
  const all: SearchTaxonomyHit[] = [
    { kind: 'category', id: '1', label: 'Mobile App', slug: 'mobile-app', meta: null },
    { kind: 'category', id: '2', label: 'Editorial', slug: 'editorial', meta: null },
    { kind: 'category', id: '3', label: 'Dashboard', slug: 'dashboard', meta: null },
    { kind: 'tag', id: 't1', label: 'Minimal', slug: 'minimal', meta: null },
    { kind: 'tag', id: 't2', label: 'Swiss', slug: 'swiss', meta: null },
    { kind: 'tag', id: 't3', label: 'Typography Focus', slug: 'typography-focus', meta: null },
    { kind: 'industry', id: 'fintech', label: 'Fintech', slug: 'fintech', meta: null },
    { kind: 'industry', id: 'media', label: 'Media', slug: 'media', meta: null },
    { kind: 'platform', id: 'ios', label: 'iOS', slug: 'ios', meta: null },
    { kind: 'platform', id: 'print', label: 'Print', slug: 'print', meta: null },
  ];
  return all.filter((item) => {
    if (params.kind && params.kind !== 'all' && item.kind !== params.kind) {
      return false;
    }
    return matchesQuery(`${item.label} ${item.slug}`, query);
  });
}

export function mockTrendingCategories(): TrendingCategory[] {
  return [
    { id: '1', name: 'Editorial', slug: 'editorial', designCount: 128 },
    { id: '2', name: 'Mobile App', slug: 'mobile-app', designCount: 96 },
    { id: '3', name: 'Dashboard', slug: 'dashboard', designCount: 84 },
    { id: '4', name: 'Brand Identity', slug: 'brand-identity', designCount: 61 },
    { id: '5', name: 'Typography', slug: 'typography', designCount: 54 },
    { id: '6', name: 'Marketing Site', slug: 'marketing-site', designCount: 49 },
  ];
}
