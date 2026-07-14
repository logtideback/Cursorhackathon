import { SEARCH_PAGE_SIZE, type SearchFilters } from '@/features/search/constants';
import { sanitizeSearchQuery } from '@/features/search/sanitize';
import {
  dateAddedToRange,
  type SearchCreatorHit,
  type SearchDesignHit,
  type SearchPage,
  type SearchTaxonomyHit,
  type TrendingCategory,
} from '@/features/search/types';
import { assertEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { DesignProvenance } from '@/types/database';

function throwOnError(error: { message: string } | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    throw error;
  }
}

export async function searchDesigns(params: {
  query: string;
  filters: SearchFilters;
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<SearchPage<SearchDesignHit>> {
  assertEnvConfigured();
  assertNotAborted(params.signal);

  const query = sanitizeSearchQuery(params.query);
  const range = dateAddedToRange(params.filters.dateAdded);
  const limit = params.limit ?? SEARCH_PAGE_SIZE;
  const offset = params.offset ?? 0;

  const { data, error } = await supabase.rpc('search_designs', {
    p_query: query || null,
    p_limit: limit,
    p_offset: offset,
    p_category_slugs: params.filters.categories,
    p_style_slugs: params.filters.styles,
    p_platforms: params.filters.platforms,
    p_industries: params.filters.industries,
    p_colour_families: params.filters.colourFamilies,
    p_provenances: params.filters.provenances as DesignProvenance[],
    p_creator_id: params.filters.creatorId,
    p_date_from: range.from,
    p_date_to: range.to,
    p_popularity: params.filters.popularity,
    p_saved_status: params.filters.savedStatus,
    p_sort: params.filters.sort,
  });

  assertNotAborted(params.signal);
  throwOnError(error, 'Failed to search designs');

  const rows = data ?? [];
  const totalCount = rows[0]?.total_count ?? 0;
  const items: SearchDesignHit[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    creatorId: row.creator_id,
    creatorName: row.creator_display_name ?? row.creator_username ?? 'Unknown creator',
    creatorUsername: row.creator_username,
    creatorAvatarUrl: row.creator_avatar_url,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    platform: row.platform,
    industry: row.industry,
    provenance: row.provenance,
    imageUrl: row.primary_image_url,
    thumbnailUrl: row.primary_thumbnail_url,
    tags: row.tags ?? [],
    saveCount: row.save_count,
    createdAt: row.created_at,
    rank: row.rank ?? 0,
  }));

  return {
    items,
    totalCount: Number(totalCount),
    nextOffset: offset + items.length < Number(totalCount) ? offset + items.length : null,
  };
}

export async function searchCreators(params: {
  query: string;
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<SearchPage<SearchCreatorHit>> {
  assertEnvConfigured();
  assertNotAborted(params.signal);

  const query = sanitizeSearchQuery(params.query);
  const limit = params.limit ?? SEARCH_PAGE_SIZE;
  const offset = params.offset ?? 0;

  const { data, error } = await supabase.rpc('search_creators', {
    p_query: query || null,
    p_limit: limit,
    p_offset: offset,
  });

  assertNotAborted(params.signal);
  throwOnError(error, 'Failed to search creators');

  const rows = data ?? [];
  const totalCount = rows[0]?.total_count ?? 0;
  const items: SearchCreatorHit[] = rows.map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    publishedDesignCount: row.published_design_count,
    rank: row.rank ?? 0,
  }));

  return {
    items,
    totalCount: Number(totalCount),
    nextOffset: offset + items.length < Number(totalCount) ? offset + items.length : null,
  };
}

export async function searchTaxonomy(params: {
  query: string;
  kind?: 'all' | 'category' | 'tag' | 'industry' | 'platform';
  limit?: number;
  signal?: AbortSignal;
}): Promise<SearchTaxonomyHit[]> {
  assertEnvConfigured();
  assertNotAborted(params.signal);

  const query = sanitizeSearchQuery(params.query);
  const { data, error } = await supabase.rpc('search_taxonomy', {
    p_query: query || null,
    p_kind: params.kind ?? 'all',
    p_limit: params.limit ?? 20,
  });

  assertNotAborted(params.signal);
  throwOnError(error, 'Failed to search taxonomy');

  return (data ?? []).map((row) => ({
    kind: row.kind as SearchTaxonomyHit['kind'],
    id: row.id,
    label: row.label,
    slug: row.slug,
    meta: row.meta,
  }));
}

export async function fetchTrendingCategories(limit = 8): Promise<TrendingCategory[]> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('get_trending_categories', {
    p_limit: limit,
  });
  throwOnError(error, 'Failed to load trending categories');
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    designCount: row.design_count,
  }));
}

export async function countSearchDesigns(params: {
  query: string;
  filters: SearchFilters;
  signal?: AbortSignal;
}): Promise<number> {
  const page = await searchDesigns({
    query: params.query,
    filters: params.filters,
    offset: 0,
    limit: 1,
    signal: params.signal,
  });
  return page.totalCount;
}
