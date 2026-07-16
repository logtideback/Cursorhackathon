import type { DesignProvenance } from '@/types/database';

import type { UploadStep } from '@/features/upload/constants';

export type LocalUploadImage = {
  localId: string;
  uri: string;
  thumbnailUri: string | null;
  width: number;
  height: number;
  mimeType: string;
  byteSize: number;
  originalFileName: string | null;
  cropApplied: boolean;
};

export type UploadImageProgress = {
  localId: string;
  status: 'pending' | 'uploading' | 'done' | 'failed' | 'cancelled';
  progress: number;
  attempts: number;
  error: string | null;
  remoteUrl: string | null;
  remoteThumbnailUrl: string | null;
  storagePath: string | null;
  thumbnailStoragePath: string | null;
};

export type UploadDraft = {
  version: 1;
  draftId: string;
  userId: string;
  designId: string | null;
  editingDesignId: string | null;
  step: UploadStep;
  images: LocalUploadImage[];
  title: string;
  description: string;
  categorySlug: string | null;
  platform: string | null;
  industry: string | null;
  tags: string[];
  provenance: DesignProvenance | null;
  sourceUrl: string;
  updatedAt: string;
};

export type PublishDesignInput = {
  designId?: string | null;
  editingDesignId?: string | null;
  title: string;
  description: string;
  categorySlug: string | null;
  platform: string | null;
  industry: string | null;
  tags: string[];
  provenance: DesignProvenance;
  sourceUrl: string | null;
  images: LocalUploadImage[];
  status: 'draft' | 'published';
};

export type PublishedDesignResult = {
  designId: string;
  imageUrls: string[];
  status: 'draft' | 'published';
};

export type SimilarDesignResult = {
  designId: string;
  title: string;
  imageUrl: string | null;
  creatorDisplayName: string | null;
  score: number;
};

export type ImageSafetyResult = {
  safe: boolean;
  score: number;
  labels: string[];
  flaggedForReview: boolean;
};

export type DuplicateImageResult = {
  isDuplicate: boolean;
  matchedDesignId: string | null;
  score: number;
  flaggedForReview: boolean;
};
