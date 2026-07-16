import {
  addDesignToCollection,
  copyDesignToCollection,
  createCollection,
  deleteCollection,
  fetchChooserOptions,
  fetchCollectionDetail,
  fetchCollectionItems,
  fetchCollectionSummaries,
  fetchCollections,
  fetchDefaultCollection,
  fetchPublicCollection,
  moveDesignBetweenCollections,
  removeDesignFromCollection,
  reorderCollectionItems,
  updateCollection,
  updateCollectionItemDetails,
  uploadCollectionCover,
} from '@/services/collections';

export { ChooseCollectionSheet } from './components/ChooseCollectionSheet';
export { CollectionCover } from './components/CollectionCover';
export { CollectionSharingState } from './components/CollectionSharingState';
export { COLLECTIONS_QUERY_KEY, COLLECTION_DETAIL_QUERY_KEY } from './constants';
export { useChooseCollection } from './hooks/useChooseCollection';
export { useCollectionDetail } from './hooks/useCollectionDetail';
export { useCollectionMutations, useCollectionsOverview } from './hooks/useCollectionsOverview';
export { CollectionDetailScreen } from './screens/CollectionDetailScreen';
export { CollectionsOverviewScreen } from './screens/CollectionsOverviewScreen';
export { CreateCollectionScreen } from './screens/CreateCollectionScreen';
export { EditCollectionScreen } from './screens/EditCollectionScreen';
export { buildPublicCollectionShareUrl, sharePublicCollection } from './share';
export type {
  ChooseCollectionOption,
  CollectionDetail,
  CollectionSummary,
  CreateCollectionInput,
} from './types';

export const collectionsApi = {
  fetchCollections,
  fetchDefaultCollection,
  fetchCollectionItems,
  fetchCollectionSummaries,
  fetchCollectionDetail,
  fetchChooserOptions,
  createCollection,
  updateCollection,
  deleteCollection,
  addDesignToCollection,
  removeDesignFromCollection,
  updateCollectionItemDetails,
  reorderCollectionItems,
  moveDesignBetweenCollections,
  copyDesignToCollection,
  fetchPublicCollection,
  uploadCollectionCover,
};

export type CollectionsFeature = 'collections';
