import type { CandidateDesign, RankedDesign } from '@/features/discover/recommendation/types';
import {
  DEFAULT_DIVERSITY_CONFIG,
  type DiversityConfig,
} from '@/features/discover/recommendation/weights';

function dominantStyle(design: CandidateDesign): string | null {
  return design.styleSlugs[0]?.toLowerCase() ?? null;
}

function categoryOf(design: CandidateDesign): string | null {
  return design.categorySlug?.toLowerCase() ?? null;
}

function consecutiveCount(values: (string | null)[], value: string | null): number {
  if (!value) {
    return 0;
  }
  let count = 0;
  for (let i = values.length - 1; i >= 0; i -= 1) {
    if (values[i] === value) {
      count += 1;
    } else {
      break;
    }
  }
  return count;
}

export type DiversityAdjustment = {
  designId: string;
  accepted: boolean;
  reason?: string;
};

/**
 * Greedy diversity pass over a score-sorted list.
 * Enforces creator caps and consecutive style/category limits,
 * while reserving controlled slots for exploratory picks.
 */
export function applyDiversityConstraints(
  ranked: RankedDesign[],
  limit: number,
  config: DiversityConfig = DEFAULT_DIVERSITY_CONFIG,
): { selected: RankedDesign[]; adjustments: DiversityAdjustment[] } {
  const selected: RankedDesign[] = [];
  const adjustments: DiversityAdjustment[] = [];
  const creatorCounts = new Map<string, number>();
  const categories: (string | null)[] = [];
  const styles: (string | null)[] = [];

  const explorationSlots = Math.max(1, Math.round(limit * config.explorationShare));
  let explorationUsed = 0;

  const corePool = ranked.filter((item) => !item.diagnostics.isExploratory);
  const explorePool = ranked.filter((item) => item.diagnostics.isExploratory);

  const tryAccept = (item: RankedDesign, asExploration: boolean): boolean => {
    const creatorCount = creatorCounts.get(item.candidate.creatorId) ?? 0;
    if (creatorCount >= config.maxPerCreatorPerBatch) {
      adjustments.push({
        designId: item.id,
        accepted: false,
        reason: 'creator_cap',
      });
      return false;
    }

    const category = categoryOf(item.candidate);
    if (consecutiveCount(categories, category) >= config.maxConsecutiveSameCategory) {
      adjustments.push({
        designId: item.id,
        accepted: false,
        reason: 'category_streak',
      });
      return false;
    }

    const style = dominantStyle(item.candidate);
    if (consecutiveCount(styles, style) >= config.maxConsecutiveSameStyle) {
      adjustments.push({
        designId: item.id,
        accepted: false,
        reason: 'style_streak',
      });
      return false;
    }

    if (asExploration && explorationUsed >= explorationSlots) {
      adjustments.push({
        designId: item.id,
        accepted: false,
        reason: 'exploration_quota',
      });
      return false;
    }

    selected.push(item);
    creatorCounts.set(item.candidate.creatorId, creatorCount + 1);
    categories.push(category);
    styles.push(style);
    if (asExploration) {
      explorationUsed += 1;
    }
    adjustments.push({
      designId: item.id,
      accepted: true,
      reason: asExploration ? 'exploration_slot' : 'core_slot',
    });
    return true;
  };

  // Fill core recommendation slots first.
  for (const item of corePool) {
    if (selected.length >= limit - Math.max(0, explorationSlots - explorationUsed)) {
      break;
    }
    tryAccept(item, false);
  }

  // Controlled exploration: prefer exploratory items still within a score gap of the top core pick.
  const topCoreScore = corePool[0]?.score ?? ranked[0]?.score ?? 0;
  const eligibleExploration = explorePool.filter(
    (item) => topCoreScore - item.score <= config.explorationMinScoreGap + 4,
  );

  for (const item of eligibleExploration) {
    if (selected.length >= limit) {
      break;
    }
    tryAccept(item, true);
  }

  // Backfill from remaining core if needed.
  if (selected.length < limit) {
    for (const item of corePool) {
      if (selected.length >= limit) {
        break;
      }
      if (selected.some((picked) => picked.id === item.id)) {
        continue;
      }
      tryAccept(item, false);
    }
  }

  // Final backfill from any remaining ranked items.
  if (selected.length < limit) {
    for (const item of ranked) {
      if (selected.length >= limit) {
        break;
      }
      if (selected.some((picked) => picked.id === item.id)) {
        continue;
      }
      tryAccept(item, item.diagnostics.isExploratory);
    }
  }

  return { selected: selected.slice(0, limit), adjustments };
}
