import {
  fetchUnseenDesigns,
  incrementDesignViewCount,
  recordSwipe,
  undoLastSwipe,
} from '@/services/designs';

export const designsApi = {
  fetchUnseenDesigns,
  recordSwipe,
  undoLastSwipe,
  incrementDesignViewCount,
};

export type DesignsFeature = 'designs';
