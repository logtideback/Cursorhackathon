import type { DesignProvenance, ExplorationLevel } from '@/types/database';

export type ShowMeLessTarget =
  'style' | 'colour_family' | 'layout_pattern' | 'category' | 'tags' | 'creator';

export const SHOW_ME_LESS_OPTIONS: {
  id: ShowMeLessTarget;
  label: string;
  body: string;
}[] = [
  {
    id: 'style',
    label: 'This style',
    body: 'Fewer designs that share the same visual style.',
  },
  {
    id: 'colour_family',
    label: 'This colour family',
    body: 'Dial down similar palettes in your feed.',
  },
  {
    id: 'layout_pattern',
    label: 'This layout pattern',
    body: 'See fewer compositions with the same structure.',
  },
  {
    id: 'category',
    label: 'This category',
    body: 'Quiet this product surface for a while.',
  },
  {
    id: 'tags',
    label: 'These tags',
    body: 'Downrank designs that share these labels.',
  },
  {
    id: 'creator',
    label: 'This creator',
    body: 'Hide this creator from recommendations without blocking.',
  },
];

export type ShowMeLessPayload = {
  designId: string;
  targets: ShowMeLessTarget[];
  styleSlugs?: string[];
  colourFamilies?: string[];
  layoutPatterns?: string[];
  categorySlug?: string | null;
  tags?: string[];
  creatorId?: string | null;
};

export type DesignContextForFeedback = {
  designId: string;
  title: string;
  creatorId: string;
  creatorName: string;
  categorySlug?: string | null;
  styleSlugs?: string[];
  colourFamilies?: string[];
  tags?: string[];
  provenance?: DesignProvenance | null;
};

export type ControlledCreator = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  at: string;
};

export type ShowLessHistoryItem = {
  id: string;
  designId: string;
  title: string;
  feedbackType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type PreferenceControls = {
  includeAiAssisted: boolean;
  includeFullyAiGenerated: boolean;
  explorationLevel: ExplorationLevel;
  dislikedCategories: string[];
  dislikedStyles: string[];
  dislikedTags: string[];
  dislikedColourFamilies: string[];
  dislikedLayoutPatterns: string[];
  hiddenCreators: ControlledCreator[];
  blockedCreators: ControlledCreator[];
  showLessHistory: ShowLessHistoryItem[];
};

export type TasteFacet = {
  key: string;
  label: string;
  count: number;
};

export type TasteShift = {
  key: string;
  label: string;
  direction: 'rising' | 'cooling';
  recentCount: number;
  priorCount: number;
};

export type TasteProfileSummary = {
  styles: TasteFacet[];
  categories: TasteFacet[];
  colourFamilies: TasteFacet[];
  tags: TasteFacet[];
  platforms: TasteFacet[];
  industries: TasteFacet[];
  creators: TasteFacet[];
  recentStyles: TasteFacet[];
  priorStyles: TasteFacet[];
  shifts: TasteShift[];
  generatedAt: string;
  source: 'remote' | 'mock';
};

export type OfflinePreferenceAction =
  | { kind: 'show_less'; payload: ShowMeLessPayload; queuedAt: string }
  | { kind: 'hide_creator'; creatorId: string; designId?: string; queuedAt: string }
  | { kind: 'unhide_creator'; creatorId: string; queuedAt: string }
  | { kind: 'block_creator'; creatorId: string; queuedAt: string }
  | { kind: 'unblock_creator'; creatorId: string; queuedAt: string };
