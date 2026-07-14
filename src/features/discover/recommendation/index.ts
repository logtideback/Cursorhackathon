import { getMockDiscoverCards } from '@/features/discover/data/mock-designs';
import { LocalRecommendationService } from '@/features/discover/recommendation/local-service';
import { SupabaseRecommendationService } from '@/features/discover/recommendation/supabase-service';
import type {
  CandidateDesign,
  RecommendationService,
} from '@/features/discover/recommendation/types';
import { isEnvConfigured } from '@/lib/env';

function mockCandidates(): CandidateDesign[] {
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

/** Prefer server ranking when Supabase is configured; otherwise local mock ranking. */
export function getRecommendationService(): RecommendationService {
  if (isEnvConfigured()) {
    return new SupabaseRecommendationService();
  }
  return new LocalRecommendationService(mockCandidates());
}

export { applyDiversityConstraints } from './diversity';
export { explainReasons, primaryExplanation } from './explanations';
export {
  EMPTY_TASTE_PROFILE,
  filterIneligibleCandidates,
  LocalRecommendationService,
  rankCandidates,
} from './local-service';
export { applyWeights, computeScoreComponents, scoreCandidate } from './score';
export { SupabaseRecommendationService } from './supabase-service';
export type { RankedDesign, RecommendationInput, RecommendationService } from './types';
export { DEFAULT_DIVERSITY_CONFIG, DEFAULT_RANKING_WEIGHTS } from './weights';
