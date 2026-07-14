import { getInfoAsync } from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

import { COMPRESS_MAX_WIDTH, COMPRESS_QUALITY, THUMBNAIL_WIDTH } from '@/features/upload/constants';
import type { LocalUploadImage } from '@/features/upload/types';
import { validateImageAsset } from '@/features/upload/validation';

function createLocalId(): string {
  return `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readByteSize(uri: string): Promise<number | null> {
  try {
    const info = await getInfoAsync(uri);
    if (info.exists && 'size' in info && typeof info.size === 'number') {
      return info.size;
    }
  } catch {
    // Fall through — size may be unavailable on some platforms.
  }
  return null;
}

export async function compressImage(
  uri: string,
  maxWidth = COMPRESS_MAX_WIDTH,
  quality = COMPRESS_QUALITY,
): Promise<{ uri: string; width: number; height: number }> {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: maxWidth } }], {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}

export async function generateThumbnail(uri: string): Promise<{
  uri: string;
  width: number;
  height: number;
}> {
  return compressImage(uri, THUMBNAIL_WIDTH, 0.7);
}

export async function cropImage(
  uri: string,
  crop: { originX: number; originY: number; width: number; height: number },
): Promise<{ uri: string; width: number; height: number }> {
  const result = await ImageManipulator.manipulateAsync(uri, [{ crop }], {
    compress: COMPRESS_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}

export type PickedAssetInput = {
  uri: string;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
};

export async function preparePickedAsset(
  asset: PickedAssetInput,
): Promise<{ ok: true; image: LocalUploadImage } | { ok: false; message: string }> {
  const rawSize = asset.fileSize ?? (await readByteSize(asset.uri));
  const precheck = validateImageAsset({
    uri: asset.uri,
    mimeType: asset.mimeType,
    fileName: asset.fileName,
    byteSize: rawSize,
    width: asset.width ?? null,
    height: asset.height ?? null,
  });
  if (!precheck.ok) {
    return { ok: false, message: precheck.message };
  }

  let compressed: { uri: string; width: number; height: number };
  try {
    compressed = await compressImage(asset.uri);
  } catch {
    return { ok: false, message: 'Could not process this image. Try another file.' };
  }

  const byteSize = (await readByteSize(compressed.uri)) ?? rawSize ?? 0;
  const postcheck = validateImageAsset({
    uri: compressed.uri,
    mimeType: 'image/jpeg',
    fileName: asset.fileName,
    byteSize,
    width: compressed.width,
    height: compressed.height,
  });
  if (!postcheck.ok) {
    return { ok: false, message: postcheck.message };
  }

  let thumbnailUri: string | null = null;
  try {
    const thumb = await generateThumbnail(compressed.uri);
    thumbnailUri = thumb.uri;
  } catch {
    thumbnailUri = null;
  }

  return {
    ok: true,
    image: {
      localId: createLocalId(),
      uri: compressed.uri,
      thumbnailUri,
      width: compressed.width,
      height: compressed.height,
      mimeType: 'image/jpeg',
      byteSize,
      originalFileName: asset.fileName ?? null,
      cropApplied: false,
    },
  };
}

export async function applyCenterCrop(image: LocalUploadImage): Promise<LocalUploadImage> {
  const side = Math.min(image.width, image.height);
  const originX = Math.max(0, Math.floor((image.width - side) / 2));
  const originY = Math.max(0, Math.floor((image.height - side) / 2));
  const cropped = await cropImage(image.uri, {
    originX,
    originY,
    width: side,
    height: side,
  });
  let thumbnailUri = image.thumbnailUri;
  try {
    const thumb = await generateThumbnail(cropped.uri);
    thumbnailUri = thumb.uri;
  } catch {
    // Keep prior thumbnail if generation fails.
  }
  const byteSize = (await readByteSize(cropped.uri)) ?? image.byteSize;
  return {
    ...image,
    uri: cropped.uri,
    thumbnailUri,
    width: cropped.width,
    height: cropped.height,
    byteSize,
    cropApplied: true,
    mimeType: 'image/jpeg',
  };
}
