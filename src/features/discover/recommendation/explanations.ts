import type { RecommendationReasonCode } from '@/features/discover/recommendation/types';

const REASON_COPY: Record<RecommendationReasonCode, string> = {
  category_match: 'From a category you selected',
  style_match: 'Matches styles in your taste profile',
  tag_similarity: 'Similar to typography and tags you save',
  platform_match: 'Fits a platform you follow',
  industry_match: 'Aligned with industries you chose',
  colour_match: 'Close to colour families you prefer',
  followed_creator: 'From a creator you follow',
  popular: 'Popular with people who save editorial design',
  fresh: 'A recent addition to Taste',
  exploration: 'An exploratory recommendation outside your usual taste',
  cold_start: 'A starting point while Taste learns what you save',
};

/** User-facing copy — never exposes raw weights. */
export function explainReasons(reasons: RecommendationReasonCode[]): string[] {
  const unique = [...new Set(reasons)];
  return unique.map((code) => REASON_COPY[code] ?? 'Recommended for you');
}

export function primaryExplanation(reasons: RecommendationReasonCode[]): string {
  return explainReasons(reasons)[0] ?? 'Recommended for you';
}
