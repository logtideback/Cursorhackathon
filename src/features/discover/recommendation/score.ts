import type {
  CandidateDesign,
  RecommendationReasonCode,
  ScoreComponents,
  ScoreDiagnostics,
  UserTasteProfile,
} from '@/features/discover/recommendation/types';
import {
  DEFAULT_RANKING_WEIGHTS,
  type RankingWeights,
} from '@/features/discover/recommendation/weights';
import { explorationMultiplier } from '@/features/preferences/apply-feedback';

function normalize(values: string[]): string[] {
  return values.map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function setOf(values: string[]): Set<string> {
  return new Set(normalize(values));
}

function overlapRatio(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }
  const rightSet = setOf(right);
  const matches = normalize(left).filter((item) => rightSet.has(item)).length;
  return matches / Math.max(normalize(left).length, 1);
}

function jaccard(left: string[], right: string[]): number {
  const a = setOf(left);
  const b = setOf(right);
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const value of a) {
    if (b.has(value)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function isColdStartProfile(profile: UserTasteProfile): boolean {
  const preferenceSignal =
    profile.preferredCategories.length +
    profile.preferredStyles.length +
    profile.preferredPlatforms.length +
    profile.preferredIndustries.length +
    profile.preferredColourFamilies.length +
    profile.likedTags.length;

  return preferenceSignal === 0 && profile.swipedDesignIds.length < 3;
}

export function popularityScore(saveCount: number, viewCount: number): number {
  const saves = Math.log1p(Math.max(0, saveCount));
  const views = Math.log1p(Math.max(0, viewCount));
  return clamp01((saves * 1.4 + views) / 12);
}

export function freshnessScore(createdAt: string, now = new Date()): number {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) {
    return 0;
  }
  const ageDays = Math.max(0, (now.getTime() - created) / (1000 * 60 * 60 * 24));
  if (ageDays <= 2) {
    return 1;
  }
  if (ageDays >= 60) {
    return 0;
  }
  return clamp01(1 - (ageDays - 2) / 58);
}

export function computeScoreComponents(
  design: CandidateDesign,
  profile: UserTasteProfile,
  now = new Date(),
): ScoreComponents {
  const preferredCategories = setOf(profile.preferredCategories);
  const preferredPlatforms = setOf(profile.preferredPlatforms);
  const preferredIndustries = setOf(profile.preferredIndustries);
  const likedTags = profile.likedTags;
  const dislikedTags = profile.dislikedTags;

  const categoryMatch =
    design.categorySlug && preferredCategories.has(design.categorySlug.toLowerCase()) ? 1 : 0;

  const styleMatch = overlapRatio(design.styleSlugs, profile.preferredStyles);
  const tagSimilarity = jaccard(design.tags, likedTags);
  const platformMatch =
    design.platform && preferredPlatforms.has(design.platform.toLowerCase()) ? 1 : 0;
  const industryMatch =
    design.industry && preferredIndustries.has(design.industry.toLowerCase()) ? 1 : 0;
  const colourMatch = overlapRatio(design.colourFamilies, profile.preferredColourFamilies);

  const followedCreator = profile.followedCreatorIds.includes(design.creatorId) ? 1 : 0;

  const negativeOverlap = overlapRatio(design.tags, [
    ...dislikedTags,
    ...profile.dislikedStyles,
    ...profile.dislikedLayoutPatterns,
  ]);
  const negativeTagPenalty = Math.max(
    negativeOverlap,
    design.categorySlug && setOf(profile.dislikedCategories).has(design.categorySlug.toLowerCase())
      ? 1
      : 0,
    overlapRatio(design.colourFamilies, profile.dislikedColourFamilies),
  );

  const explicitShowLessPenalty =
    profile.showLessDesignIds.includes(design.id) ||
    profile.showLessCreatorIds.includes(design.creatorId) ||
    profile.hiddenCreatorIds.includes(design.creatorId)
      ? 1
      : 0;

  const creatorRepetition = profile.recentCreatorIds.filter((id) => id === design.creatorId).length;
  const styleRepetition = normalize(design.styleSlugs).filter((style) =>
    setOf(profile.recentStyleSlugs).has(style),
  ).length;
  const categoryRepetition =
    design.categorySlug && setOf(profile.recentCategorySlugs).has(design.categorySlug.toLowerCase())
      ? 1
      : 0;

  const repetitionPenalty = clamp01(
    creatorRepetition * 0.45 + styleRepetition * 0.25 + categoryRepetition * 0.35,
  );

  const affinity =
    categoryMatch * 0.35 +
    styleMatch * 0.35 +
    tagSimilarity * 0.2 +
    platformMatch * 0.05 +
    industryMatch * 0.05;

  const explorationBonus =
    (affinity < 0.2
      ? clamp01(0.55 + popularityScore(design.saveCount, design.viewCount) * 0.25)
      : affinity < 0.45
        ? clamp01(0.25)
        : 0) * explorationMultiplier(profile.explorationLevel);

  return {
    categoryMatch,
    styleMatch,
    tagSimilarity,
    platformMatch,
    industryMatch,
    colourMatch,
    followedCreator,
    popularityScore: popularityScore(design.saveCount, design.viewCount),
    freshnessScore: freshnessScore(design.createdAt, now),
    explorationBonus,
    negativeTagPenalty,
    explicitShowLessPenalty,
    repetitionPenalty,
  };
}

export function applyWeights(
  components: ScoreComponents,
  weights: RankingWeights = DEFAULT_RANKING_WEIGHTS,
): { score: number; weighted: Record<keyof ScoreComponents, number> } {
  const weighted = {
    categoryMatch: components.categoryMatch * weights.categoryMatch,
    styleMatch: components.styleMatch * weights.styleMatch,
    tagSimilarity: components.tagSimilarity * weights.tagSimilarity,
    platformMatch: components.platformMatch * weights.platformMatch,
    industryMatch: components.industryMatch * weights.industryMatch,
    colourMatch: components.colourMatch * weights.colourMatch,
    followedCreator: components.followedCreator * weights.followedCreator,
    popularityScore: components.popularityScore * weights.popularity,
    freshnessScore: components.freshnessScore * weights.freshness,
    explorationBonus: components.explorationBonus * weights.explorationBonus,
    negativeTagPenalty: components.negativeTagPenalty * weights.negativeTagPenalty,
    explicitShowLessPenalty: components.explicitShowLessPenalty * weights.explicitShowLessPenalty,
    repetitionPenalty: components.repetitionPenalty * weights.repetitionPenalty,
  };

  const score =
    weighted.categoryMatch +
    weighted.styleMatch +
    weighted.tagSimilarity +
    weighted.platformMatch +
    weighted.industryMatch +
    weighted.colourMatch +
    weighted.followedCreator +
    weighted.popularityScore +
    weighted.freshnessScore +
    weighted.explorationBonus -
    weighted.negativeTagPenalty -
    weighted.explicitShowLessPenalty -
    weighted.repetitionPenalty;

  return { score, weighted };
}

export function buildDiagnostics(
  components: ScoreComponents,
  weights: RankingWeights,
  options: { isColdStart: boolean },
): ScoreDiagnostics {
  const { score, weighted } = applyWeights(components, weights);
  const penaltiesApplied: string[] = [];
  if (components.negativeTagPenalty > 0) {
    penaltiesApplied.push('negative_tags');
  }
  if (components.explicitShowLessPenalty > 0) {
    penaltiesApplied.push('show_less');
  }
  if (components.repetitionPenalty > 0) {
    penaltiesApplied.push('repetition');
  }

  return {
    finalScore: score,
    components,
    weighted,
    penaltiesApplied,
    isExploratory: components.explorationBonus >= 0.4 && components.categoryMatch === 0,
    isColdStart: options.isColdStart,
  };
}

export function reasonsFromComponents(
  components: ScoreComponents,
  diagnostics: ScoreDiagnostics,
): RecommendationReasonCode[] {
  const reasons: RecommendationReasonCode[] = [];

  if (components.followedCreator > 0) {
    reasons.push('followed_creator');
  }
  if (components.categoryMatch > 0) {
    reasons.push('category_match');
  }
  if (components.styleMatch >= 0.25) {
    reasons.push('style_match');
  }
  if (components.tagSimilarity >= 0.15) {
    reasons.push('tag_similarity');
  }
  if (diagnostics.isExploratory) {
    reasons.push('exploration');
  }
  if (diagnostics.isColdStart) {
    reasons.push('cold_start');
  }
  if (components.platformMatch > 0) {
    reasons.push('platform_match');
  }
  if (components.industryMatch > 0) {
    reasons.push('industry_match');
  }
  if (components.colourMatch >= 0.25) {
    reasons.push('colour_match');
  }
  if (components.popularityScore >= 0.55) {
    reasons.push('popular');
  }
  if (components.freshnessScore >= 0.7) {
    reasons.push('fresh');
  }

  return reasons.slice(0, 4);
}

export function scoreCandidate(
  design: CandidateDesign,
  profile: UserTasteProfile,
  weights: RankingWeights = DEFAULT_RANKING_WEIGHTS,
  now = new Date(),
): { score: number; diagnostics: ScoreDiagnostics; reasons: RecommendationReasonCode[] } {
  const coldStart = isColdStartProfile(profile);
  const components = computeScoreComponents(design, profile, now);

  // Cold-start leans on popularity, freshness, and featured exploration.
  if (coldStart) {
    components.explorationBonus = Math.max(
      components.explorationBonus,
      design.isFeatured ? 0.8 : 0.45,
    );
    components.popularityScore = Math.max(components.popularityScore, 0.35);
  }

  const diagnostics = buildDiagnostics(components, weights, { isColdStart: coldStart });
  const reasons = reasonsFromComponents(components, diagnostics);
  return { score: diagnostics.finalScore, diagnostics, reasons };
}
