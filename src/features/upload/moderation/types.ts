import type {
  DuplicateImageResult,
  ImageSafetyResult,
  SimilarDesignResult,
} from '@/features/upload/types';

export interface ImageSafetyService {
  checkImage(imageUrl: string): Promise<ImageSafetyResult>;
}

export interface DuplicateImageService {
  findDuplicates(imageUrl: string): Promise<DuplicateImageResult>;
}

export interface DesignSimilarityService {
  findSimilarDesigns(imageUrl: string): Promise<SimilarDesignResult[]>;
}

export type ModerationBundle = {
  safety: ImageSafetyResult;
  duplicate: DuplicateImageResult;
  similar: SimilarDesignResult[];
};
