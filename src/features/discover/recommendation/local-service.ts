import { applyDiversityConstraints } from '@/features/discover/recommendation/diversity';
import { scoreCandidate } from '@/features/discover/recommendation/score';
import type {
  CandidateDesign,
  RankedDesign,
  RecommendationInput,
  RecommendationService,
  UserTasteProfile,
} from '@/features/discover/recommendation/types';
import {
  DEFAULT_DIVERSITY_CONFIG,
  DEFAULT_RANKING_WEIGHTS,
} from '@/features/discover/recommendation/weights';

export const EMPTY_TASTE_PROFILE: UserTasteProfile = {
  preferredCategories: [],
  preferredStyles: [],
  preferredPlatforms: [],
  preferredIndustries: [],
  preferredColourFamilies: [],
  likedTags: [],
  dislikedTags: [],
  showLessDesignIds: [],
  showLessCreatorIds: [],
  followedCreatorIds: [],
  blockedCreatorIds: [],
  recentCreatorIds: [],
  recentStyleSlugs: [],
  recentCategorySlugs: [],
  swipedDesignIds: [],
};

export function filterIneligibleCandidates(
  candidates: CandidateDesign[],
  profile: UserTasteProfile,
  excludeDesignIds: string[] = [],
): CandidateDesign[] {
  const excluded = new Set([...profile.swipedDesignIds, ...excludeDesignIds]);
  const blocked = new Set(profile.blockedCreatorIds);
  const hiddenCreators = new Set(profile.showLessCreatorIds);

  return candidates.filter((design) => {
    if (excluded.has(design.id)) {
      return false;
    }
    if (blocked.has(design.creatorId) || hiddenCreators.has(design.creatorId)) {
      return false;
    }
    if (profile.showLessDesignIds.includes(design.id)) {
      return false;
    }
    return true;
  });
}

/**
 * Pure deterministic ranker — used by unit tests and the local/mock service.
 * Production traffic should prefer the Supabase RPC so the client never
 * downloads the full designs table.
 */
export function rankCandidates(input: {
  candidates: CandidateDesign[];
  profile: UserTasteProfile;
  limit: number;
  excludeDesignIds?: string[];
  now?: Date;
  weights?: typeof DEFAULT_RANKING_WEIGHTS;
}): RankedDesign[] {
  const weights = input.weights ?? DEFAULT_RANKING_WEIGHTS;
  const now = input.now ?? new Date();
  const filtered = filterIneligibleCandidates(
    input.candidates,
    input.profile,
    input.excludeDesignIds,
  );

  const scored = filtered
    .map((candidate) => {
      const result = scoreCandidate(candidate, input.profile, weights, now);
      return {
        id: candidate.id,
        creatorId: candidate.creatorId,
        title: candidate.title,
        score: result.score,
        reasons: result.reasons,
        diagnostics: result.diagnostics,
        candidate,
      } satisfies RankedDesign;
    })
    .sort((a, b) => b.score - a.score);

  const { selected } = applyDiversityConstraints(scored, input.limit, DEFAULT_DIVERSITY_CONFIG);
  return selected;
}

/**
 * Local/mock recommendation service for development and cold environments.
 * Only ranks a provided candidate slice — never intended for full-table scans.
 */
export class LocalRecommendationService implements RecommendationService {
  constructor(private readonly catalog: CandidateDesign[]) {}

  async getRecommendedDesigns(input: RecommendationInput): Promise<RankedDesign[]> {
    const profile = input.profile ?? EMPTY_TASTE_PROFILE;
    const limit = Math.max(1, Math.min(input.limit ?? 12, 50));
    const candidates = input.candidates ?? this.catalog;

    return rankCandidates({
      candidates,
      profile,
      limit,
      excludeDesignIds: input.excludeDesignIds,
      now: input.now,
      weights: input.weights,
    });
  }
}
