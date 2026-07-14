/**
 * Configurable ranking weights for the deterministic Taste scorer.
 * Replace or tune without changing scoring formulas.
 */
export type RankingWeights = {
  categoryMatch: number;
  styleMatch: number;
  tagSimilarity: number;
  platformMatch: number;
  industryMatch: number;
  colourMatch: number;
  followedCreator: number;
  popularity: number;
  freshness: number;
  explorationBonus: number;
  negativeTagPenalty: number;
  explicitShowLessPenalty: number;
  repetitionPenalty: number;
};

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  categoryMatch: 4,
  styleMatch: 4,
  tagSimilarity: 3,
  platformMatch: 2,
  industryMatch: 2,
  colourMatch: 2,
  followedCreator: 3,
  popularity: 1.5,
  freshness: 1.5,
  explorationBonus: 1,
  negativeTagPenalty: 4,
  explicitShowLessPenalty: 6,
  repetitionPenalty: 3,
};

export type DiversityConfig = {
  maxPerCreatorPerBatch: number;
  maxConsecutiveSameCategory: number;
  maxConsecutiveSameStyle: number;
  explorationShare: number;
  explorationMinScoreGap: number;
};

export const DEFAULT_DIVERSITY_CONFIG: DiversityConfig = {
  maxPerCreatorPerBatch: 2,
  maxConsecutiveSameCategory: 2,
  maxConsecutiveSameStyle: 2,
  /** ~1 in 6 slots reserved for controlled exploration. */
  explorationShare: 1 / 6,
  explorationMinScoreGap: 2,
};
