/**
 * Pure helpers that fold preference feedback into the local taste profile /
 * eligibility filter used by recommendations.
 */

import type { CandidateDesign, UserTasteProfile } from '@/features/discover/recommendation/types';
import type { ShowMeLessPayload, ShowMeLessTarget } from '@/features/preferences/types';
import type { ExplorationLevel } from '@/types/database';

export function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

export function applyShowLessToProfile(
  profile: UserTasteProfile,
  payload: ShowMeLessPayload,
): UserTasteProfile {
  const targets = new Set(payload.targets);
  const next: UserTasteProfile = {
    ...profile,
    showLessDesignIds: uniqueStrings([...profile.showLessDesignIds, payload.designId]),
    dislikedTags: [...profile.dislikedTags],
    dislikedStyles: [...profile.dislikedStyles],
    dislikedCategories: [...profile.dislikedCategories],
    dislikedColourFamilies: [...profile.dislikedColourFamilies],
    dislikedLayoutPatterns: [...profile.dislikedLayoutPatterns],
    showLessCreatorIds: [...profile.showLessCreatorIds],
    hiddenCreatorIds: [...profile.hiddenCreatorIds],
  };

  if (targets.has('style')) {
    next.dislikedStyles = uniqueStrings([...next.dislikedStyles, ...(payload.styleSlugs ?? [])]);
  }
  if (targets.has('colour_family')) {
    next.dislikedColourFamilies = uniqueStrings([
      ...next.dislikedColourFamilies,
      ...(payload.colourFamilies ?? []),
    ]);
  }
  if (targets.has('layout_pattern')) {
    next.dislikedLayoutPatterns = uniqueStrings([
      ...next.dislikedLayoutPatterns,
      ...(payload.layoutPatterns ?? payload.styleSlugs ?? []),
    ]);
  }
  if (targets.has('category') && payload.categorySlug) {
    next.dislikedCategories = uniqueStrings([...next.dislikedCategories, payload.categorySlug]);
  }
  if (targets.has('tags')) {
    next.dislikedTags = uniqueStrings([...next.dislikedTags, ...(payload.tags ?? [])]);
  }
  if (targets.has('creator') && payload.creatorId) {
    next.showLessCreatorIds = uniqueStrings([...next.showLessCreatorIds, payload.creatorId]);
    next.hiddenCreatorIds = uniqueStrings([...next.hiddenCreatorIds, payload.creatorId]);
  }

  return next;
}

export function isCandidateExcludedByFeedback(
  design: CandidateDesign,
  profile: UserTasteProfile,
): boolean {
  if (profile.showLessDesignIds.includes(design.id)) {
    return true;
  }
  if (profile.blockedCreatorIds.includes(design.creatorId)) {
    return true;
  }
  if (
    profile.showLessCreatorIds.includes(design.creatorId) ||
    profile.hiddenCreatorIds.includes(design.creatorId)
  ) {
    return true;
  }

  const dislikedCategories = new Set(
    profile.dislikedCategories.map((value) => value.toLowerCase()),
  );
  if (design.categorySlug && dislikedCategories.has(design.categorySlug.toLowerCase())) {
    return true;
  }

  const dislikedStyles = new Set(
    [...profile.dislikedStyles, ...profile.dislikedLayoutPatterns].map((value) =>
      value.toLowerCase(),
    ),
  );
  if (design.styleSlugs.some((slug) => dislikedStyles.has(slug.toLowerCase()))) {
    return true;
  }

  const dislikedColours = new Set(
    profile.dislikedColourFamilies.map((value) => value.toLowerCase()),
  );
  if (design.colourFamilies.some((family) => dislikedColours.has(family.toLowerCase()))) {
    return true;
  }

  const dislikedTags = new Set(profile.dislikedTags.map((value) => value.toLowerCase()));
  if (design.tags.some((tag) => dislikedTags.has(tag.toLowerCase()))) {
    return true;
  }

  if (profile.includeAiAssisted === false && design.provenance === 'ai_assisted') {
    return true;
  }
  if (profile.includeFullyAiGenerated === false && design.provenance === 'fully_ai_generated') {
    return true;
  }

  return false;
}

export function explorationMultiplier(level: ExplorationLevel | undefined): number {
  switch (level) {
    case 'focused':
      return 0.45;
    case 'adventurous':
      return 1.6;
    default:
      return 1;
  }
}

export function defaultTargetsWhenEmpty(targets: ShowMeLessTarget[]): ShowMeLessTarget[] {
  return targets.length > 0 ? targets : ['style', 'tags'];
}
