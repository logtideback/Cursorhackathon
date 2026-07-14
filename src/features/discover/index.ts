import {
  fetchUnseenDesigns,
  incrementDesignViewCount,
  recordSwipe,
  undoLastSwipe,
} from '@/services/designs';

export const discoverApi = {
  fetchUnseenDesigns,
  recordSwipe,
  undoLastSwipe,
  incrementDesignViewCount,
};

export type DiscoverFeature = 'discover';
