import type {
  RankedDesign,
  RecommendationReasonCode,
  ScoreDiagnostics,
} from '@/features/discover/recommendation/types';
import type { DiscoverCard } from '@/features/discover/types';

export type RecommendedFeedItem = DiscoverCard & {
  reasons: RecommendationReasonCode[];
  score: number;
  diagnostics: ScoreDiagnostics;
};

export function toRecommendedFeedItem(
  ranked: RankedDesign,
  enrich?: Partial<DiscoverCard>,
): RecommendedFeedItem {
  return {
    id: ranked.id,
    title: enrich?.title ?? ranked.title,
    description: enrich?.description ?? null,
    creatorId: ranked.creatorId,
    creatorName: enrich?.creatorName ?? 'Creator',
    creatorUsername: enrich?.creatorUsername ?? null,
    category: enrich?.category ?? ranked.candidate.categorySlug,
    platform: enrich?.platform ?? ranked.candidate.platform,
    tags: enrich?.tags ?? ranked.candidate.tags.slice(0, 3),
    saveCount: enrich?.saveCount ?? ranked.candidate.saveCount,
    imageUrl: enrich?.imageUrl ?? '',
    thumbnailUrl: enrich?.thumbnailUrl ?? null,
    source: ranked.id.startsWith('mock-') ? 'mock' : 'remote',
    reasons: ranked.reasons,
    score: ranked.score,
    diagnostics: ranked.diagnostics,
  };
}
