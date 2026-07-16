import type { SavedAspect, Tables } from '@/types/database';

export type CollectionSummary = Tables<'collections'> & {
  designCount: number;
  mosaicUrls: string[];
};

export type CollectionDesignItem = {
  itemId: string;
  designId: string;
  note: string | null;
  savedAspect: SavedAspect | null;
  sortOrder: number;
  createdAt: string;
  title: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  unavailable: boolean;
};

export type CollectionDetail = {
  collection: Tables<'collections'>;
  items: CollectionDesignItem[];
  isOwner: boolean;
};

export type PublicCollectionPayload = {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  is_private: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  items: {
    id: string;
    design_id: string;
    note: string | null;
    saved_aspect: SavedAspect | null;
    sort_order: number;
    created_at: string;
    design_title: string | null;
    design_status: string | null;
    image_url: string | null;
    thumbnail_url: string | null;
  }[];
};

export type ChooseCollectionOption = {
  id: string;
  name: string;
  isDefault: boolean;
  isPrivate: boolean;
  containsDesign: boolean;
  updatedAt: string;
  mosaicUrls: string[];
};

export type CreateCollectionInput = {
  name: string;
  description?: string | null;
  isPrivate: boolean;
  coverImageUrl?: string | null;
};

export type UpdateCollectionInput = {
  name?: string;
  description?: string | null;
  isPrivate?: boolean;
  coverImageUrl?: string | null;
};
