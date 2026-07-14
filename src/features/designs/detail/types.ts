import type { DesignProvenance, DesignStatus, SavedAspect, Tables } from '@/types/database';

export type DesignImage = {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
};

export type DesignCreatorSummary = {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  publishedDesignCount: number;
  accountStatus: 'active' | 'suspended';
  isFollowing: boolean;
  isSelf: boolean;
};

export type DesignDetail = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  platform: string | null;
  industry: string | null;
  tags: string[];
  provenance: DesignProvenance;
  status: DesignStatus;
  sourceUrl: string | null;
  saveCount: number;
  viewCount: number;
  images: DesignImage[];
  creator: DesignCreatorSummary;
  source: 'remote' | 'mock';
};

export type DesignSaveEntry = {
  collectionId: string;
  collectionName: string;
  isDefault: boolean;
  note: string | null;
  savedAspect: SavedAspect | null;
  itemId: string;
};

export type DesignSaveState = {
  isSaved: boolean;
  entries: DesignSaveEntry[];
  defaultCollection: Tables<'collections'> | null;
};

export type SimilarDesignCard = {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  creatorName: string;
};

export type DesignDetailErrorKind =
  'not_found' | 'deleted' | 'suspended_creator' | 'offline' | 'permission' | 'unknown';

export type SourceLinkState =
  { status: 'missing' } | { status: 'valid'; url: string } | { status: 'invalid'; reason: string };
