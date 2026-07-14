import type { CreatorProfile } from '@/features/creators/types';
import { assertEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { DesignProvenance, ReportReason, Tables } from '@/types/database';

function throwOnError(error: { message: string } | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function fetchCreatorProfile(creatorId: string): Promise<CreatorProfile | null> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('get_creator_profile', {
    p_creator_id: creatorId,
  });
  throwOnError(error, 'Failed to load creator profile');
  if (!data) {
    return null;
  }

  const row = data as Record<string, unknown>;
  const designs = Array.isArray(row.designs) ? row.designs : [];
  const collections = Array.isArray(row.public_collections) ? row.public_collections : [];

  return {
    id: String(row.id),
    username: (row.username as string | null) ?? null,
    displayName: (row.display_name as string | null) ?? null,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    websiteUrl: (row.website_url as string | null) ?? null,
    accountStatus: (row.account_status as 'active' | 'suspended') ?? 'active',
    isSelf: Boolean(row.is_self),
    isFollowing: Boolean(row.is_following),
    isBlocking: Boolean(row.is_blocking),
    isBlockedByThem: Boolean(row.is_blocked_by_them),
    followerCount: Number(row.follower_count ?? 0),
    followingCount: Number(row.following_count ?? 0),
    publishedDesignCount: Number(row.published_design_count ?? 0),
    designs: designs.map((item) => {
      const design = item as Record<string, unknown>;
      return {
        id: String(design.id),
        title: String(design.title ?? 'Untitled'),
        provenance: (design.provenance as DesignProvenance) ?? 'original_work',
        saveCount: Number(design.save_count ?? 0),
        createdAt: String(design.created_at ?? ''),
        imageUrl: (design.image_url as string | null) ?? null,
        thumbnailUrl: (design.thumbnail_url as string | null) ?? null,
      };
    }),
    publicCollections: collections.map((item) => {
      const collection = item as Record<string, unknown>;
      return {
        id: String(collection.id),
        name: String(collection.name ?? 'Collection'),
        description: (collection.description as string | null) ?? null,
        cover_image_url: (collection.cover_image_url as string | null) ?? null,
        updated_at: String(collection.updated_at ?? ''),
      };
    }),
    source: 'remote',
  };
}

export async function reportCreator(params: {
  creatorId: string;
  reason: ReportReason;
  notes?: string | null;
}): Promise<Tables<'reports'>> {
  assertEnvConfigured();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  throwOnError(userError, 'Failed to resolve user');
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      design_id: null,
      reported_creator_id: params.creatorId,
      reason: params.reason,
      notes: params.notes ?? null,
    })
    .select('*')
    .single();

  throwOnError(error, 'Failed to report creator');
  if (!data) {
    throw new Error('Failed to report creator');
  }
  return data;
}
