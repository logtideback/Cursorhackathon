import { describe, expect, it } from 'vitest';

import { applyDiversityConstraints } from '@/features/discover/recommendation/diversity';
import {
  EMPTY_TASTE_PROFILE,
  filterIneligibleCandidates,
  rankCandidates,
} from '@/features/discover/recommendation/local-service';
import { scoreCandidate } from '@/features/discover/recommendation/score';
import type {
  CandidateDesign,
  RankedDesign,
  UserTasteProfile,
} from '@/features/discover/recommendation/types';

function candidate(
  partial: Partial<CandidateDesign> & Pick<CandidateDesign, 'id' | 'creatorId'>,
): CandidateDesign {
  return {
    title: partial.title ?? partial.id,
    categorySlug: partial.categorySlug ?? 'editorial',
    platform: partial.platform ?? 'iOS',
    industry: partial.industry ?? 'SaaS',
    colourFamilies: partial.colourFamilies ?? [],
    styleSlugs: partial.styleSlugs ?? ['minimal'],
    tags: partial.tags ?? ['Minimal'],
    saveCount: partial.saveCount ?? 40,
    viewCount: partial.viewCount ?? 200,
    createdAt: partial.createdAt ?? new Date().toISOString(),
    isFeatured: partial.isFeatured ?? false,
    id: partial.id,
    creatorId: partial.creatorId,
  };
}

const settledProfile: UserTasteProfile = {
  ...EMPTY_TASTE_PROFILE,
  preferredCategories: ['editorial', 'dashboard'],
  preferredStyles: ['minimal', 'soft-ui'],
  likedTags: ['minimal'],
  swipedDesignIds: ['seed-1', 'seed-2', 'seed-3'],
};

function rankedFrom(
  design: CandidateDesign,
  profile: UserTasteProfile = settledProfile,
): RankedDesign {
  const scored = scoreCandidate(design, profile);
  return {
    id: design.id,
    creatorId: design.creatorId,
    title: design.title,
    score: scored.score,
    reasons: scored.reasons,
    diagnostics: {
      ...scored.diagnostics,
      // Force core-pool behavior for diversity unit tests.
      isExploratory: false,
      isColdStart: false,
    },
    candidate: design,
  };
}

describe('diversity constraints', () => {
  it('limits a creator to two designs in a batch', () => {
    const designs = [
      candidate({ id: 'a1', creatorId: 'c1', saveCount: 200 }),
      candidate({ id: 'a2', creatorId: 'c1', saveCount: 190 }),
      candidate({ id: 'a3', creatorId: 'c1', saveCount: 180 }),
      candidate({ id: 'b1', creatorId: 'c2', saveCount: 170 }),
    ].map((design) => rankedFrom(design));

    const { selected, adjustments } = applyDiversityConstraints(designs, 4);
    const fromC1 = selected.filter((item) => item.creatorId === 'c1');
    expect(fromC1.length).toBeLessThanOrEqual(2);
    expect(adjustments.some((item) => item.reason === 'creator_cap' && !item.accepted)).toBe(true);
  });

  it('breaks long category streaks', () => {
    const designs = [
      rankedFrom(
        candidate({ id: '1', creatorId: 'c1', categorySlug: 'editorial', saveCount: 100 }),
      ),
      rankedFrom(candidate({ id: '2', creatorId: 'c2', categorySlug: 'editorial', saveCount: 99 })),
      rankedFrom(candidate({ id: '3', creatorId: 'c3', categorySlug: 'editorial', saveCount: 98 })),
      rankedFrom(candidate({ id: '4', creatorId: 'c4', categorySlug: 'dashboard', saveCount: 97 })),
    ];

    const { selected, adjustments } = applyDiversityConstraints(designs, 4);
    expect(adjustments.some((item) => item.reason === 'category_streak' && !item.accepted)).toBe(
      true,
    );

    const categories = selected.map((item) => item.candidate.categorySlug);
    let longestEditorialRun = 0;
    let run = 0;
    for (const category of categories) {
      if (category === 'editorial') {
        run += 1;
        longestEditorialRun = Math.max(longestEditorialRun, run);
      } else {
        run = 0;
      }
    }
    expect(longestEditorialRun).toBeLessThanOrEqual(2);
  });

  it('filters swiped, blocked, and hidden creators before ranking', () => {
    const pool = [
      candidate({ id: 'keep', creatorId: 'safe' }),
      candidate({ id: 'swiped', creatorId: 'safe' }),
      candidate({ id: 'blocked-design', creatorId: 'blocked' }),
      candidate({ id: 'hidden-design', creatorId: 'hidden' }),
    ];

    const filtered = filterIneligibleCandidates(pool, {
      ...EMPTY_TASTE_PROFILE,
      swipedDesignIds: ['swiped'],
      blockedCreatorIds: ['blocked'],
      showLessCreatorIds: ['hidden'],
    });

    expect(filtered.map((item) => item.id)).toEqual(['keep']);
  });

  it('includes controlled exploration for outside-taste designs', () => {
    const profile: UserTasteProfile = {
      ...settledProfile,
      preferredCategories: ['dashboard'],
      preferredStyles: ['soft-ui'],
      likedTags: ['dashboard'],
    };

    const pool = [
      candidate({
        id: 'core',
        creatorId: 'c1',
        categorySlug: 'dashboard',
        styleSlugs: ['soft-ui'],
        tags: ['Dashboard'],
        saveCount: 80,
      }),
      candidate({
        id: 'explore',
        creatorId: 'c2',
        categorySlug: 'brutallist',
        styleSlugs: ['brutalist'],
        tags: ['Brutalist'],
        saveCount: 220,
        isFeatured: true,
      }),
      candidate({
        id: 'core-2',
        creatorId: 'c3',
        categorySlug: 'dashboard',
        styleSlugs: ['soft-ui'],
        tags: ['Dashboard'],
        saveCount: 70,
      }),
      candidate({
        id: 'core-3',
        creatorId: 'c4',
        categorySlug: 'dashboard',
        styleSlugs: ['soft-ui'],
        tags: ['Dashboard'],
        saveCount: 60,
      }),
      candidate({
        id: 'core-4',
        creatorId: 'c5',
        categorySlug: 'dashboard',
        styleSlugs: ['soft-ui'],
        tags: ['Dashboard'],
        saveCount: 55,
      }),
      candidate({
        id: 'core-5',
        creatorId: 'c6',
        categorySlug: 'dashboard',
        styleSlugs: ['soft-ui'],
        tags: ['Dashboard'],
        saveCount: 50,
      }),
    ];

    const ranked = rankCandidates({ candidates: pool, profile, limit: 6 });
    expect(ranked.some((item) => item.id === 'explore' || item.diagnostics.isExploratory)).toBe(
      true,
    );
  });
});
