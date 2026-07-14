import {
  addDesignToCollection,
  fetchCollectionItems,
  fetchCollections,
  fetchDefaultCollection,
  removeDesignFromCollection,
} from '@/services/collections';

export const collectionsApi = {
  fetchCollections,
  fetchDefaultCollection,
  fetchCollectionItems,
  addDesignToCollection,
  removeDesignFromCollection,
};

export type CollectionsFeature = 'collections';
