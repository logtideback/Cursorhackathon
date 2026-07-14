import { assertEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type {
  RecordSwipeResult,
  SwipeDirection,
  UndoSwipeResult,
  UnseenDesignRow,
} from '@/types/database';

import type { DesignDetail, SimilarDesignCard } from '@/features/designs/detail/types';

function requireData<T>(
  data: T | null,
  error: { message: string } | null,
  fallbackMessage: string,
): T {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
  if (data === null) {
    throw new Error(fallbackMessage);
  }
  return data;
}

export async function fetchUnseenDesigns(limit = 20): Promise<UnseenDesignRow[]> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('get_unseen_designs', { p_limit: limit });
  return requireData(data, error, 'Failed to fetch unseen designs');
}

export async function recordSwipe(
  designId: string,
  direction: SwipeDirection,
): Promise<RecordSwipeResult> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('record_swipe', {
    p_design_id: designId,
    p_direction: direction,
  });
  const result = requireData(data, error, 'Failed to record swipe');
  return result as unknown as RecordSwipeResult;
}

export async function undoLastSwipe(): Promise<UndoSwipeResult> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('undo_last_swipe');
  const result = requireData(data, error, 'Failed to undo swipe');
  return result as unknown as UndoSwipeResult;
}

export async function incrementDesignViewCount(designId: string): Promise<number> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('increment_design_view_count', {
    p_design_id: designId,
  });
  return requireData(data, error, 'Failed to increment view count');
}

export async function fetchSimilarDesigns(
  designId: string,
  limit = 12,
): Promise<UnseenDesignRow[]> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('get_similar_designs', {
    p_design_id: designId,
    p_limit: limit,
  });
  if (error) {
    throw new Error(error.message || 'Failed to fetch similar designs');
  }
  return data ?? [];
}

export async function countPublishedDesigns(creatorId: string): Promise<number> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('count_published_designs', {
    p_creator_id: creatorId,
  });
  if (error) {
    throw new Error(error.message || 'Failed to count published designs');
  }
  return typeof data === 'number' ? data : 0;
}

/**
 * Loads a full design detail document: design row, images, tags, category, creator, follow state.
 * Returns null when the design is missing, unpublished, or inaccessible under RLS.
 */
export async function fetchDesignDetail(designId: string): Promise<DesignDetail | null> {
  assertEnvConfigured();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    throw new Error(userError.message || 'Failed to resolve user');
  }
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: design, error: designError } = await supabase
    .from('designs')
    .select('*')
    .eq('id', designId)
    .maybeSingle();

  if (designError) {
    const message = designError.message.toLowerCase();
    if (message.includes('permission') || message.includes('row-level')) {
      const permissionError = new Error('permission_denied');
      permissionError.name = 'PermissionError';
      throw permissionError;
    }
    throw new Error(designError.message || 'Failed to fetch design');
  }

  if (!design) {
    return null;
  }

  if (design.status === 'removed' || design.status === 'archived') {
    return null;
  }

  const [
    { data: creator, error: creatorError },
    { data: imagesData, error: imagesError },
    { data: tagRows, error: tagsError },
    { data: category, error: categoryError },
    { data: followRow },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', design.creator_id).maybeSingle(),
    supabase
      .from('design_images')
      .select('id, image_url, thumbnail_url, width, height, sort_order')
      .eq('design_id', designId)
      .order('sort_order', { ascending: true }),
    supabase.from('design_tags').select('tag_id').eq('design_id', designId),
    design.category_id
      ? supabase.from('categories').select('name').eq('id', design.category_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', design.creator_id)
      .maybeSingle(),
  ]);

  if (creatorError) {
    throw new Error(creatorError.message || 'Failed to fetch creator');
  }
  if (!creator) {
    return null;
  }
  if (imagesError) {
    throw new Error(imagesError.message || 'Failed to fetch design images');
  }
  if (tagsError) {
    throw new Error(tagsError.message || 'Failed to fetch design tags');
  }
  if (categoryError) {
    throw new Error(categoryError.message || 'Failed to fetch category');
  }

  const tagIds = (tagRows ?? []).map((row) => row.tag_id);
  let tags: string[] = [];
  if (tagIds.length > 0) {
    const { data: tagRecords, error: tagNameError } = await supabase
      .from('tags')
      .select('name')
      .in('id', tagIds);
    if (tagNameError) {
      throw new Error(tagNameError.message || 'Failed to resolve tags');
    }
    tags = (tagRecords ?? []).map((tag) => tag.name);
  }

  const publishedCount = await countPublishedDesigns(design.creator_id).catch(() => 0);

  const images = (imagesData ?? []).map((image) => ({
    id: image.id,
    imageUrl: image.image_url,
    thumbnailUrl: image.thumbnail_url,
    width: image.width,
    height: image.height,
    sortOrder: image.sort_order,
  }));

  return {
    id: design.id,
    title: design.title,
    description: design.description,
    category: category?.name ?? null,
    platform: design.platform,
    industry: design.industry,
    tags,
    provenance: design.provenance,
    status: design.status,
    sourceUrl: design.source_url,
    saveCount: design.save_count,
    viewCount: design.view_count,
    images,
    creator: {
      id: creator.id,
      displayName: creator.display_name ?? creator.username ?? 'Unknown creator',
      username: creator.username,
      avatarUrl: creator.avatar_url,
      publishedDesignCount: publishedCount,
      accountStatus: creator.account_status ?? 'active',
      isFollowing: Boolean(followRow),
      isSelf: creator.id === user.id,
    },
    source: 'remote',
  };
}

export function mapUnseenToSimilar(rows: UnseenDesignRow[]): SimilarDesignCard[] {
  return rows
    .filter((row) => Boolean(row.primary_image_url || row.primary_thumbnail_url))
    .map((row) => ({
      id: row.id,
      title: row.title,
      imageUrl: row.primary_image_url ?? row.primary_thumbnail_url ?? '',
      thumbnailUrl: row.primary_thumbnail_url,
      creatorName: row.creator_display_name ?? row.creator_username ?? 'Unknown creator',
    }));
}
