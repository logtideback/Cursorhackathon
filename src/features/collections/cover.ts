import { MOSAIC_MAX_TILES } from '@/features/collections/constants';

/** Prefer custom cover, otherwise the first few item thumbnails for a mosaic. */
export function resolveCoverSources(params: {
  customCoverUrl?: string | null;
  itemImageUrls: (string | null | undefined)[];
  maxTiles?: number;
}): string[] {
  if (params.customCoverUrl) {
    return [params.customCoverUrl];
  }

  const max = params.maxTiles ?? MOSAIC_MAX_TILES;
  const unique: string[] = [];
  for (const url of params.itemImageUrls) {
    if (!url || unique.includes(url)) {
      continue;
    }
    unique.push(url);
    if (unique.length >= max) {
      break;
    }
  }
  return unique;
}

export type MosaicLayout = 'empty' | 'single' | 'split' | 'triptych' | 'quad';

export function mosaicLayoutForCount(count: number): MosaicLayout {
  if (count <= 0) {
    return 'empty';
  }
  if (count === 1) {
    return 'single';
  }
  if (count === 2) {
    return 'split';
  }
  if (count === 3) {
    return 'triptych';
  }
  return 'quad';
}
