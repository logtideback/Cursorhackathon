import type {
  DesignSimilarityService,
  DuplicateImageService,
  ImageSafetyService,
  ModerationBundle,
} from '@/features/upload/moderation/types';
import type {
  DuplicateImageResult,
  ImageSafetyResult,
  SimilarDesignResult,
} from '@/features/upload/types';

/**
 * Mocked safety check — never blocks publish; may flag low-confidence results for review.
 */
export class MockImageSafetyService implements ImageSafetyService {
  async checkImage(imageUrl: string): Promise<ImageSafetyResult> {
    const hash = simpleHash(imageUrl);
    const score = 0.92 + (hash % 8) / 100;
    return {
      safe: true,
      score,
      labels: score < 0.95 ? ['needs_human_review'] : [],
      flaggedForReview: score < 0.95,
    };
  }
}

/**
 * Mocked duplicate check — occasionally surfaces a soft match for review tooling.
 */
export class MockDuplicateImageService implements DuplicateImageService {
  async findDuplicates(imageUrl: string): Promise<DuplicateImageResult> {
    const hash = simpleHash(imageUrl);
    const softMatch = hash % 11 === 0;
    return {
      isDuplicate: false,
      matchedDesignId: softMatch ? `mock-dup-${hash % 97}` : null,
      score: softMatch ? 0.72 : 0.12,
      flaggedForReview: softMatch,
    };
  }
}

/**
 * Mocked similarity service — returns neutral “visually similar” examples.
 * Replace with embeddings / perceptual hash search later.
 */
export class MockDesignSimilarityService implements DesignSimilarityService {
  async findSimilarDesigns(imageUrl: string): Promise<SimilarDesignResult[]> {
    const hash = simpleHash(imageUrl);
    return [
      {
        designId: `similar-${hash % 1000}`,
        title: 'Calm landing type system',
        imageUrl: null,
        creatorDisplayName: 'Studio North',
        score: 0.81,
      },
      {
        designId: `similar-${(hash % 1000) + 1}`,
        title: 'Product empty state study',
        imageUrl: null,
        creatorDisplayName: 'Mira Chen',
        score: 0.74,
      },
      {
        designId: `similar-${(hash % 1000) + 2}`,
        title: 'Editorial commerce grid',
        imageUrl: null,
        creatorDisplayName: 'Atelier Form',
        score: 0.68,
      },
    ];
  }
}

export const imageSafetyService: ImageSafetyService = new MockImageSafetyService();
export const duplicateImageService: DuplicateImageService = new MockDuplicateImageService();
export const designSimilarityService: DesignSimilarityService = new MockDesignSimilarityService();

export async function runPrePublishModeration(primaryImageUrl: string): Promise<ModerationBundle> {
  const [safety, duplicate, similar] = await Promise.all([
    imageSafetyService.checkImage(primaryImageUrl),
    duplicateImageService.findDuplicates(primaryImageUrl),
    designSimilarityService.findSimilarDesigns(primaryImageUrl),
  ]);
  return { safety, duplicate, similar };
}

function simpleHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}
