import { describe, expect, it } from 'vitest';

import { EMPTY_TASTE_PROFILE } from '@/features/discover/recommendation/local-service';
import {
  applyWeights,
  computeScoreComponents,
  isColdStartProfile,
  popularityScore,
  scoreCandidate,
} from '@/features/discover/recommendation/score';
import type { CandidateDesign, UserTasteProfile } from '@/features/discover/recommendation/types';
import { DEFAULT_RANKING_WEIGHTS } from '@/features/discover/recommendation/weights';

const baseDesign: CandidateDesign = {
  id: 'design-1',
  creatorId: 'creator-1',
  title: 'Editorial poster',
  categorySlug: 'editorial',
  platform: 'Print',
  industry: 'Media',
  colourFamilies: ['warm-neutrals'],
  styleSlugs: ['typography', 'swiss'],
  tags: ['Typography', 'Swiss'],
  saveCount: 120,
  viewCount: 900,
  createdAt: new Date().toISOString(),
  isFeatured: true,
};

function profile(overrides: Partial<UserTasteProfile> = {}): UserTasteProfile {
  return {
    ...EMPTY_TASTE_PROFILE,
    preferredCategories: ['editorial'],
    preferredStyles: ['typography', 'swiss'],
    preferredPlatforms: ['print'],
    preferredIndustries: ['media'],
    preferredColourFamilies: ['warm-neutrals'],
    likedTags: ['typography'],
    ...overrides,
  };
}

describe('scoreCandidate', () => {
  it('rewards preference matches using configured weights', () => {
    const components = computeScoreComponents(baseDesign, profile());
    const { score, weighted } = applyWeights(components, DEFAULT_RANKING_WEIGHTS);

    expect(components.categoryMatch).toBe(1);
    expect(components.styleMatch).toBeGreaterThan(0.5);
    expect(components.platformMatch).toBe(1);
    expect(weighted.categoryMatch).toBe(DEFAULT_RANKING_WEIGHTS.categoryMatch);
    expect(score).toBeGreaterThan(10);
  });

  it('applies negative tag and show-less penalties', () => {
    const punitive = profile({
      dislikedTags: ['typography'],
      showLessDesignIds: ['design-1'],
    });
    const result = scoreCandidate(baseDesign, punitive);
    expect(result.diagnostics.components.negativeTagPenalty).toBeGreaterThan(0);
    expect(result.diagnostics.components.explicitShowLessPenalty).toBe(1);
    expect(result.diagnostics.penaltiesApplied).toEqual(
      expect.arrayContaining(['negative_tags', 'show_less']),
    );
    expect(result.score).toBeLessThan(scoreCandidate(baseDesign, profile()).score);
  });

  it('detects cold-start users and boosts exploration-friendly signals', () => {
    expect(isColdStartProfile(EMPTY_TASTE_PROFILE)).toBe(true);
    const result = scoreCandidate(baseDesign, EMPTY_TASTE_PROFILE);
    expect(result.diagnostics.isColdStart).toBe(true);
    expect(result.reasons).toContain('cold_start');
    expect(result.diagnostics.components.explorationBonus).toBeGreaterThan(0);
  });

  it('scores followed creators higher', () => {
    const followed = scoreCandidate(baseDesign, profile({ followedCreatorIds: ['creator-1'] }));
    const baseline = scoreCandidate(baseDesign, profile());
    expect(followed.score).toBeGreaterThan(baseline.score);
    expect(followed.reasons).toContain('followed_creator');
  });

  it('clamps popularity into a 0-1 signal', () => {
    expect(popularityScore(0, 0)).toBe(0);
    expect(popularityScore(10_000, 50_000)).toBeLessThanOrEqual(1);
  });
});
