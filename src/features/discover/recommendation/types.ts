import type { RankingWeights } from '@/features/discover/recommendation/weights';

export type RecommendationReasonCode =
  | 'category_match'
  | 'style_match'
  | 'tag_similarity'
  | 'platform_match'
  | 'industry_match'
  | 'colour_match'
  | 'followed_creator'
  | 'popular'
  | 'fresh'
  | 'exploration'
  | 'cold_start';

export type UserTasteProfile = {
  preferredCategories: string[];
  preferredStyles: string[];
  preferredPlatforms: string[];
  preferredIndustries: string[];
  preferredColourFamilies: string[];
  likedTags: string[];
  dislikedTags: string[];
  dislikedStyles: string[];
  dislikedCategories: string[];
  dislikedColourFamilies: string[];
  dislikedLayoutPatterns: string[];
  showLessDesignIds: string[];
  showLessCreatorIds: string[];
  hiddenCreatorIds: string[];
  followedCreatorIds: string[];
  blockedCreatorIds: string[];
  recentCreatorIds: string[];
  recentStyleSlugs: string[];
  recentCategorySlugs: string[];
  swipedDesignIds: string[];
  includeAiAssisted: boolean;
  includeFullyAiGenerated: boolean;
  explorationLevel: 'focused' | 'balanced' | 'adventurous';
};

export type CandidateDesign = {
  id: string;
  creatorId: string;
  title: string;
  categorySlug: string | null;
  platform: string | null;
  industry: string | null;
  colourFamilies: string[];
  styleSlugs: string[];
  tags: string[];
  saveCount: number;
  viewCount: number;
  createdAt: string;
  isFeatured: boolean;
  provenance?: string | null;
};

export type ScoreComponents = {
  categoryMatch: number;
  styleMatch: number;
  tagSimilarity: number;
  platformMatch: number;
  industryMatch: number;
  colourMatch: number;
  followedCreator: number;
  popularityScore: number;
  freshnessScore: number;
  explorationBonus: number;
  negativeTagPenalty: number;
  explicitShowLessPenalty: number;
  repetitionPenalty: number;
};

export type ScoreDiagnostics = {
  finalScore: number;
  components: ScoreComponents;
  weighted: Record<keyof ScoreComponents, number>;
  penaltiesApplied: string[];
  isExploratory: boolean;
  isColdStart: boolean;
};

export type RankedDesign = {
  id: string;
  creatorId: string;
  title: string;
  score: number;
  reasons: RecommendationReasonCode[];
  diagnostics: ScoreDiagnostics;
  candidate: CandidateDesign;
};

export type RecommendationInput = {
  userId: string;
  limit?: number;
  excludeDesignIds?: string[];
  profile?: UserTasteProfile;
  candidates?: CandidateDesign[];
  now?: Date;
  weights?: RankingWeights;
};

export type RecommendationService = {
  getRecommendedDesigns(input: RecommendationInput): Promise<RankedDesign[]>;
};
