import { create } from 'zustand';

import type {
  RecommendationReasonCode,
  ScoreDiagnostics,
} from '@/features/discover/recommendation/types';

type RecommendationMeta = {
  reasons: RecommendationReasonCode[];
  diagnostics: ScoreDiagnostics | null;
  score: number | null;
};

type RecommendationMetaState = {
  byDesignId: Record<string, RecommendationMeta>;
  setMeta: (designId: string, meta: RecommendationMeta) => void;
  getMeta: (designId: string) => RecommendationMeta | null;
  clear: () => void;
};

export const useRecommendationMetaStore = create<RecommendationMetaState>((set, get) => ({
  byDesignId: {},
  setMeta: (designId, meta) =>
    set((state) => ({
      byDesignId: {
        ...state.byDesignId,
        [designId]: meta,
      },
    })),
  getMeta: (designId) => get().byDesignId[designId] ?? null,
  clear: () => set({ byDesignId: {} }),
}));
