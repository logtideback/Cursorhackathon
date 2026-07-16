import { describe, expect, it } from 'vitest';

import { explainReasons } from '@/features/discover/recommendation/explanations';
import {
  EMPTY_TASTE_PROFILE,
  filterIneligibleCandidates,
} from '@/features/discover/recommendation/local-service';
import { scoreCandidate } from '@/features/discover/recommendation/score';
import type { CandidateDesign, UserTasteProfile } from '@/features/discover/recommendation/types';
import {
  applyShowLessToProfile,
  isCandidateExcludedByFeedback,
} from '@/features/preferences/apply-feedback';

const design: CandidateDesign = {
  id: 'design-neo',
  creatorId: 'creator-neo',
  title: 'Neon brutalist board',
  categorySlug: 'dashboard',
  platform: 'web',
  industry: 'saas',
  colourFamilies: ['ochre'],
  styleSlugs: ['brutalist', 'neon'],
  tags: ['neon', 'dense'],
  saveCount: 40,
  viewCount: 200,
  createdAt: new Date().toISOString(),
  isFeatured: false,
  provenance: 'ai_assisted',
};

function profile(overrides: Partial<UserTasteProfile> = {}): UserTasteProfile {
  return { ...EMPTY_TASTE_PROFILE, ...overrides };
}

describe('applyShowLessToProfile', () => {
  it('folds style and tag targets into disliked preference arrays', () => {
    const next = applyShowLessToProfile(profile(), {
      designId: design.id,
      targets: ['style', 'tags'],
      styleSlugs: design.styleSlugs,
      tags: design.tags,
      creatorId: design.creatorId,
    });

    expect(next.showLessDesignIds).toContain(design.id);
    expect(next.dislikedStyles).toEqual(expect.arrayContaining(['brutalist', 'neon']));
    expect(next.dislikedTags).toEqual(expect.arrayContaining(['neon', 'dense']));
  });

  it('hides creator when creator target is selected without blocking', () => {
    const next = applyShowLessToProfile(profile(), {
      designId: design.id,
      targets: ['creator'],
      creatorId: design.creatorId,
    });
    expect(next.hiddenCreatorIds).toContain(design.creatorId);
    expect(next.showLessCreatorIds).toContain(design.creatorId);
    expect(next.blockedCreatorIds).not.toContain(design.creatorId);
  });
});

describe('isCandidateExcludedByFeedback', () => {
  it('excludes disliked styles and colour families from recommendations', () => {
    const withStyle = profile({ dislikedStyles: ['brutalist'] });
    expect(isCandidateExcludedByFeedback(design, withStyle)).toBe(true);

    const withColour = profile({ dislikedColourFamilies: ['ochre'] });
    expect(isCandidateExcludedByFeedback(design, withColour)).toBe(true);
  });

  it('respects AI provenance user controls without auto-penalising when enabled', () => {
    expect(isCandidateExcludedByFeedback(design, profile())).toBe(false);
    expect(isCandidateExcludedByFeedback(design, profile({ includeAiAssisted: false }))).toBe(true);

    const allowed = scoreCandidate(design, profile({ preferredStyles: ['brutalist'] }));
    expect(allowed.diagnostics.penaltiesApplied).not.toContain('ai_provenance');
  });

  it('filters hidden and blocked creators from the candidate pool', () => {
    const candidates = [design];
    const hidden = filterIneligibleCandidates(
      candidates,
      profile({ hiddenCreatorIds: [design.creatorId] }),
    );
    expect(hidden).toHaveLength(0);

    const blocked = filterIneligibleCandidates(
      candidates,
      profile({ blockedCreatorIds: [design.creatorId] }),
    );
    expect(blocked).toHaveLength(0);
  });
});

describe('recommendation explanations', () => {
  it('uses neutral editorial copy', () => {
    expect(explainReasons(['exploration', 'followed_creator', 'popular'])).toEqual([
      'An exploratory recommendation',
      'From a creator you follow',
      'Popular among users with similar saves',
    ]);
  });
});
