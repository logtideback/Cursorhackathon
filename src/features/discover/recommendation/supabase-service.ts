import { EMPTY_TASTE_PROFILE } from '@/features/discover/recommendation/local-service';
import type {
  RankedDesign,
  RecommendationInput,
  RecommendationReasonCode,
  RecommendationService,
  ScoreComponents,
  ScoreDiagnostics,
} from '@/features/discover/recommendation/types';
import { assertEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';

type RecommendedDesignRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  category_slug: string | null;
  category_name: string | null;
  source_url: string | null;
  platform: string | null;
  industry: string | null;
  provenance: string;
  status: string;
  is_featured: boolean;
  save_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  creator_username: string | null;
  creator_display_name: string | null;
  creator_avatar_url: string | null;
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

/**
 * Server-backed recommendation client.
 * Ranking runs inside Postgres (`get_recommended_designs`) so the app
 * never downloads the full designs table to score locally.
 */
export class SupabaseRecommendationService implements RecommendationService {
  async getRecommendedDesigns(input: RecommendationInput): Promise<RankedDesign[]> {
    assertEnvConfigured();
    const limit = Math.max(1, Math.min(input.limit ?? 12, 50));

    const { data, error } = await supabase.rpc('get_recommended_designs', {
      p_limit: limit,
      p_exclude_ids: input.excludeDesignIds ?? [],
    });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as RecommendedDesignRow[];
    return rows.map((row) => {
      const diagnostics =
        row.diagnostics ??
        ({
          finalScore: row.score,
          components: emptyComponents(),
          weighted: emptyComponents(),
          penaltiesApplied: [],
          isExploratory: (row.reason_codes ?? []).includes('exploration'),
          isColdStart: (row.reason_codes ?? []).includes('cold_start'),
        } satisfies ScoreDiagnostics);

      return {
        id: row.id,
        creatorId: row.creator_id,
        title: row.title,
        score: row.score,
        reasons: (row.reason_codes ?? []) as RecommendationReasonCode[],
        diagnostics,
        candidate: {
          id: row.id,
          creatorId: row.creator_id,
          title: row.title,
          categorySlug: row.category_slug,
          platform: row.platform,
          industry: row.industry,
          colourFamilies: row.colour_families ?? [],
          styleSlugs: row.style_slugs ?? [],
          tags: row.tags ?? [],
          saveCount: row.save_count,
          viewCount: row.view_count,
          createdAt: row.created_at,
          isFeatured: row.is_featured,
        },
      };
    });
  }
}

export function createRecommendationService(): RecommendationService {
  // Lazy factory — callers that lack env should use LocalRecommendationService with mocks.
  return new SupabaseRecommendationService();
}

export { EMPTY_TASTE_PROFILE };
