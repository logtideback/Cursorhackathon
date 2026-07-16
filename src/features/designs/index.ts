import {
  countPublishedDesigns,
  fetchDesignDetail,
  fetchSimilarDesigns,
  fetchUnseenDesigns,
  incrementDesignViewCount,
  mapUnseenToSimilar,
  recordSwipe,
  undoLastSwipe,
} from '@/services/designs';

export { PROVENANCE_LABELS, REPORT_REASON_OPTIONS, SAVED_ASPECT_OPTIONS } from './detail/constants';
export { DesignDetailScreen } from './detail/DesignDetailScreen';
export type { DesignDetail, DesignSaveState, SimilarDesignCard } from './detail/types';

export const designsApi = {
  fetchUnseenDesigns,
  recordSwipe,
  undoLastSwipe,
  incrementDesignViewCount,
  fetchDesignDetail,
  fetchSimilarDesigns,
  countPublishedDesigns,
  mapUnseenToSimilar,
};

export type DesignsFeature = 'designs';
