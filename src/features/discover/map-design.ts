import type { UnseenDesignRow } from '@/types/database';

import type { DiscoverCard } from '@/features/discover/types';

export function mapUnseenDesign(
  row: UnseenDesignRow,
  source: 'remote' | 'mock' = 'remote',
): DiscoverCard {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    creatorId: row.creator_id,
    creatorName: row.creator_display_name ?? row.creator_username ?? 'Unknown creator',
    creatorUsername: row.creator_username,
    category: null,
    platform: row.platform,
    tags: (row.tags ?? []).slice(0, 3),
    saveCount: row.save_count,
    imageUrl: row.primary_image_url ?? row.primary_thumbnail_url ?? '',
    thumbnailUrl: row.primary_thumbnail_url,
    source,
  };
}

/** Attach category labels when available from joined data later. */
export function withCategoryLabel(card: DiscoverCard, categoryName?: string | null): DiscoverCard {
  if (!categoryName) {
    return card;
  }
  return { ...card, category: categoryName };
}
