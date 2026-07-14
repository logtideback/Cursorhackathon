import type { DesignProvenance } from '@/types/database';

import { PROVENANCE_EXPLANATIONS } from '@/features/creators/constants';

export const UPLOAD_DRAFT_STORAGE_KEY = 'taste:upload-draft' as const;
export const DESIGN_IMAGES_BUCKET = 'design-images' as const;

/** Soft app limit — bucket allows 15MB; keep headroom after compression. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGES_PER_DESIGN = 8;
export const MIN_IMAGE_DIMENSION = 400;
export const MAX_IMAGE_DIMENSION = 8000;
export const COMPRESS_MAX_WIDTH = 2400;
export const THUMBNAIL_WIDTH = 480;
export const COMPRESS_QUALITY = 0.78;
export const UPLOAD_MAX_ATTEMPTS = 3;
export const UPLOAD_RETRY_BASE_MS = 500;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const;

export const UPLOAD_STEPS = [
  'select',
  'review',
  'reorder',
  'crop',
  'title',
  'description',
  'category',
  'platform',
  'industry',
  'tags',
  'provenance',
  'source',
  'preview',
  'publish',
] as const;

export type UploadStep = (typeof UPLOAD_STEPS)[number];

export const UPLOAD_STEP_COPY: Record<UploadStep, { label: string; title: string; body: string }> =
  {
    select: {
      label: 'Images',
      title: 'Select images',
      body: 'Choose one or more design shots from your library.',
    },
    review: {
      label: 'Review',
      title: 'Review selection',
      body: 'Remove any frames that do not belong before continuing.',
    },
    reorder: {
      label: 'Order',
      title: 'Reorder images',
      body: 'The first image becomes the cover in Discover and Search.',
    },
    crop: {
      label: 'Adjust',
      title: 'Crop or adjust',
      body: 'Straighten focus where needed. Skip any image you want to leave as-is.',
    },
    title: {
      label: 'Title',
      title: 'Add a title',
      body: 'A short name helps people recognise the work later.',
    },
    description: {
      label: 'Description',
      title: 'Add a description',
      body: 'Share context — the problem, constraints, or what to notice.',
    },
    category: {
      label: 'Category',
      title: 'Choose a category',
      body: 'Pick the closest product surface for this design.',
    },
    platform: {
      label: 'Platform',
      title: 'Select a platform',
      body: 'Where does this experience primarily live?',
    },
    industry: {
      label: 'Industry',
      title: 'Select an industry',
      body: 'Optional context that improves recommendations.',
    },
    tags: {
      label: 'Tags',
      title: 'Add tags',
      body: 'A few precise tags help Taste surface your work to the right eyes.',
    },
    provenance: {
      label: 'Provenance',
      title: 'Choose provenance',
      body: 'Be transparent about how this work was made.',
    },
    source: {
      label: 'Source',
      title: 'Add a source URL',
      body: 'Link to the live product, case study, or Figma file when you can.',
    },
    preview: {
      label: 'Preview',
      title: 'Preview before publishing',
      body: 'Confirm details and review similar designs already in Taste.',
    },
    publish: {
      label: 'Publish',
      title: 'Publish',
      body: 'Uploading images and publishing your design.',
    },
  };

export const PROVENANCE_OPTIONS: {
  value: DesignProvenance;
  label: string;
  body: string;
}[] = (Object.keys(PROVENANCE_EXPLANATIONS) as DesignProvenance[]).map((value) => ({
  value,
  label: PROVENANCE_EXPLANATIONS[value].label,
  body: PROVENANCE_EXPLANATIONS[value].body,
}));

export const SIMILARITY_REVIEW_COPY =
  'Here are some visually similar designs already in Taste. Review them before publishing.';
