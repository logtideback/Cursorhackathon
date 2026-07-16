import type { DesignProvenance, ReportReason, SavedAspect } from '@/types/database';

export const DESIGN_DETAIL_QUERY_KEY = 'design-detail' as const;
export const DESIGN_SAVES_QUERY_KEY = 'design-saves' as const;
export const SIMILAR_DESIGNS_QUERY_KEY = 'similar-designs' as const;
export const COLLECTIONS_QUERY_KEY = 'collections' as const;
export const FOLLOW_QUERY_KEY = 'follow-status' as const;

export const SIMILAR_DESIGNS_LIMIT = 12;
export const GALLERY_ASPECT_RATIO = 4 / 5;
export const MIN_TOUCH_TARGET = 44;

export const PROVENANCE_LABELS: Record<DesignProvenance, string> = {
  original_work: 'Original work',
  client_work: 'Client work',
  concept: 'Concept',
  redesign: 'Redesign',
  ai_assisted: 'AI-assisted',
  fully_ai_generated: 'Fully AI-generated',
};

export const SAVED_ASPECT_OPTIONS: { value: SavedAspect; label: string }[] = [
  { value: 'typography', label: 'Typography' },
  { value: 'layout', label: 'Layout' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'motion', label: 'Motion' },
  { value: 'colour', label: 'Colour' },
  { value: 'branding', label: 'Branding' },
  { value: 'interaction', label: 'Interaction' },
  { value: 'other', label: 'Other' },
];

export const REPORT_REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: 'copyright', label: 'Copyright concern' },
  { value: 'stolen_work', label: 'Stolen work' },
  { value: 'spam', label: 'Spam' },
  { value: 'misleading', label: 'Misleading attribution' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'broken_source', label: 'Broken source' },
  { value: 'other', label: 'Other' },
];
