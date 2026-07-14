import { getMockDiscoverCards, isMockDesignId } from '@/features/discover/data/mock-designs';
import { LocalRecommendationService } from '@/features/discover/recommendation/local-service';
import type { RecommendedFeedItem } from '@/features/discover/recommendation/map-ranked';
import { toRecommendedFeedItem } from '@/features/discover/recommendation/map-ranked';
import type {
  CandidateDesign,
  RecommendationReasonCode,
  ScoreComponents,
  ScoreDiagnostics,
} from '@/features/discover/recommendation/types';
import { isEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useRecommendationMetaStore } from '@/store/recommendation-meta-store';

function mockCandidatesFromCards(): CandidateDesign[] {
  return getMockDiscoverCards(20).map((card) => ({
    id: card.id,
    creatorId: card.creatorId,
    title: card.title,
    categorySlug: card.category?.toLowerCase().replace(/\s+/g, '-') ?? null,
    platform: card.platform,
    industry: null,
    colourFamilies: [],
    styleSlugs: card.tags.map((tag) => tag.toLowerCase().replace(/\s+/g, '-')),
    tags: card.tags,
    saveCount: card.saveCount,
    viewCount: card.saveCount * 8,
    createdAt: new Date().toISOString(),
    isFeatured: card.saveCount > 150,
  }));
}

type RpcRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category_slug: string | null;
  category_name: string | null;
  platform: string | null;
  industry: string | null;
  is_featured: boolean;
  save_count: number;
  view_count: number;
  created_at: string;
  creator_username: string | null;
  creator_display_name: string | null;
  primary_image_url: string | null;
  primary_thumbnail_url: string | null;
  tags: string[];
  style_slugs: string[];
  colour_families: string[];
  score: number;
  reason_codes: string[];
  diagnostics: ScoreDiagnostics | null;
};

function emptyComponents(): ScoreComponents {
  return {
    categoryMatch: 0,
    styleMatch: 0,
    tagSimilarity: 0,
    platformMatch: 0,
    industryMatch: 0,
    colourMatch: 0,
    followedCreator: 0,
    popularityScore: 0,
    freshnessScore: 0,
    explorationBonus: 0,
    negativeTagPenalty: 0,
    explicitShowLessPenalty: 0,
    repetitionPenalty: 0,
  };
}

function rememberMeta(items: RecommendedFeedItem[]) {
  const setMeta = useRecommendationMetaStore.getState().setMeta;
  for (const item of items) {
    setMeta(item.id, {
      reasons: item.reasons,
      diagnostics: item.diagnostics,
      score: item.score,
    });
  }
}

function mapRpcRow(row: RpcRow): RecommendedFeedItem {
  const reasons = (row.reason_codes ?? []) as RecommendationReasonCode[];
  const diagnostics =
    row.diagnostics ??
    ({
      finalScore: Number(row.score),
      components: emptyComponents(),
      weighted: emptyComponents(),
      penaltiesApplied: [],
      isExploratory: reasons.includes('exploration'),
      isColdStart: reasons.includes('cold_start'),
    } satisfies ScoreDiagnostics);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    creatorId: row.creator_id,
    creatorName: row.creator_display_name ?? row.creator_username ?? 'Creator',
    creatorUsername: row.creator_username,
    category: row.category_name ?? row.category_slug,
    platform: row.platform,
    tags: (row.tags ?? []).slice(0, 3),
    saveCount: row.save_count,
    imageUrl: row.primary_image_url ?? '',
    thumbnailUrl: row.primary_thumbnail_url,
    source: 'remote',
    reasons,
    score: Number(row.score),
    diagnostics,
  };
}

async function fetchRecommendedFeedLocal(options: {
  limit: number;
  excludeIds: string[];
}): Promise<RecommendedFeedItem[]> {
  const local = new LocalRecommendationService(mockCandidatesFromCards());
  const ranked = await local.getRecommendedDesigns({
    userId: 'local',
    limit: options.limit,
    excludeDesignIds: options.excludeIds,
  });
  const mocks = getMockDiscoverCards(20);
  const items = ranked.map((entry) => {
    const mock = mocks.find((card) => card.id === entry.id);
    return toRecommendedFeedItem(entry, mock);
  });
  rememberMeta(items);
  return items.filter((item) => !options.excludeIds.includes(item.id));
}

/**
 * Loads a ranked Discover page from the server when configured,
 * otherwise ranks the local mock catalog (never the full designs table).
 */
export async function fetchRecommendedFeed(options: {
  limit: number;
  excludeIds: string[];
}): Promise<RecommendedFeedItem[]> {
  if (!isEnvConfigured()) {
    return fetchRecommendedFeedLocal(options);
  }

  try {
    const exclude = options.excludeIds.filter((id) => !isMockDesignId(id));
    const { data, error } = await supabase.rpc('get_recommended_designs', {
      p_limit: options.limit,
      p_exclude_ids: exclude,
    });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as RpcRow[];
    if (rows.length === 0) {
      return fetchRecommendedFeedLocal(options);
    }

    const items = rows.map(mapRpcRow).filter((item) => Boolean(item.imageUrl));
    rememberMeta(items);
    return items;
  } catch {
    return fetchRecommendedFeedLocal(options);
  }
}
