import type { RecommendationReasonCode } from '@/features/discover/recommendation/types';

const REASON_COPY: Record<RecommendationReasonCode, string> = {
  category_match: 'Similar to editorial designs you save',
  style_match: 'Matches your typography preferences',
  tag_similarity: 'Close to tags you keep saving',
  platform_match: 'Fits a platform you return to',
  industry_match: 'Aligned with industries you collect',
  colour_match: 'Near the colour families you favour',
  followed_creator: 'From a creator you follow',
  popular: 'Popular among users with similar saves',
  fresh: 'A recent addition to Taste',
  exploration: 'An exploratory recommendation',
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
