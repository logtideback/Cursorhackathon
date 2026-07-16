import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_DIMENSION,
  MAX_IMAGES_PER_DESIGN,
  MIN_IMAGE_DIMENSION,
} from '@/features/upload/constants';

export type ImageValidationErrorCode =
  | 'unsupported_type'
  | 'file_too_large'
  | 'dimensions_too_small'
  | 'dimensions_too_large'
  | 'too_many_images'
  | 'unreadable';

export type ImageValidationResult =
  { ok: true } | { ok: false; code: ImageValidationErrorCode; message: string };

export function extensionFromUri(uri: string, fileName?: string | null): string | null {
  const source = fileName || uri.split('?')[0] || '';
  const match = /\.([a-zA-Z0-9]+)$/.exec(source);
  return match?.[1]?.toLowerCase() ?? null;
}

export function isAllowedMimeType(mimeType: string | null | undefined): boolean {
  if (!mimeType) {
    return false;
  }
  const normalized = mimeType.toLowerCase();
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(normalized);
}

export function isAllowedExtension(ext: string | null): boolean {
  if (!ext) {
    return false;
  }
  return (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext);
}

export function validateImageAsset(input: {
  mimeType?: string | null;
  fileName?: string | null;
  uri: string;
  byteSize: number | null;
  width: number | null;
  height: number | null;
}): ImageValidationResult {
  const mimeOk = isAllowedMimeType(input.mimeType);
  const ext = extensionFromUri(input.uri, input.fileName);
  const extOk = isAllowedExtension(ext);

  if (!mimeOk && !extOk) {
    return {
      ok: false,
      code: 'unsupported_type',
      message: 'Use JPEG, PNG, WebP, or GIF images.',
    };
  }

  if (input.byteSize != null && input.byteSize > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      code: 'file_too_large',
      message: `Each image must be under ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))}MB.`,
    };
  }

  if (
    input.width != null &&
    input.height != null &&
    (input.width < MIN_IMAGE_DIMENSION || input.height < MIN_IMAGE_DIMENSION)
  ) {
    return {
      ok: false,
      code: 'dimensions_too_small',
      message: `Images must be at least ${MIN_IMAGE_DIMENSION}×${MIN_IMAGE_DIMENSION}px.`,
    };
  }

  if (
    input.width != null &&
    input.height != null &&
    (input.width > MAX_IMAGE_DIMENSION || input.height > MAX_IMAGE_DIMENSION)
  ) {
    return {
      ok: false,
      code: 'dimensions_too_large',
      message: `Images must be at most ${MAX_IMAGE_DIMENSION}×${MAX_IMAGE_DIMENSION}px.`,
    };
  }

  return { ok: true };
}

export function validateImageCount(
  currentCount: number,
  addingCount: number,
): ImageValidationResult {
  if (currentCount + addingCount > MAX_IMAGES_PER_DESIGN) {
    return {
      ok: false,
      code: 'too_many_images',
      message: `You can upload up to ${MAX_IMAGES_PER_DESIGN} images per design.`,
    };
  }
  return { ok: true };
}

export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 32);
}

export function parseTagInput(raw: string): string[] {
  const parts = raw
    .split(/[,，\n]/)
    .map(normalizeTag)
    .filter(Boolean);
  return Array.from(new Set(parts)).slice(0, 12);
}

export function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function buildDesignStoragePath(
  userId: string,
  designId: string,
  fileId: string,
  kind: 'full' | 'thumb' = 'full',
): string {
  const name = kind === 'thumb' ? `thumb_${fileId}.jpg` : `${fileId}.jpg`;
  return `${userId}/designs/${designId}/${name}`;
}

export function reorderItems<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (moved === undefined) {
    return items;
  }
  next.splice(toIndex, 0, moved);
  return next;
}
