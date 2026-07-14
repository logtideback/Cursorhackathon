import { assertEnvConfigured, isEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { DesignProvenance, Json, Tables } from '@/types/database';

import {
  DESIGN_IMAGES_BUCKET,
  UPLOAD_MAX_ATTEMPTS,
  UPLOAD_RETRY_BASE_MS,
} from '@/features/upload/constants';
import type {
  LocalUploadImage,
  PublishDesignInput,
  PublishedDesignResult,
  SimilarDesignResult,
  UploadImageProgress,
} from '@/features/upload/types';
import { buildDesignStoragePath, normalizeTag } from '@/features/upload/validation';

function throwOnError(error: { message: string } | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createUuid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  throwOnError(error, 'Failed to resolve user');
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user.id;
}

async function resolveCategoryId(slug: string | null): Promise<string | null> {
  if (!slug) {
    return null;
  }
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  throwOnError(error, 'Failed to resolve category');
  return data?.id ?? null;
}

async function resolveTagIds(tags: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const raw of tags) {
    const slug = normalizeTag(raw);
    if (!slug) {
      continue;
    }
    const name = raw.trim() || slug;
    const { data: existing, error: lookupError } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    throwOnError(lookupError, 'Failed to look up tag');
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const { data: created, error: createError } = await supabase
      .from('tags')
      .insert({ name, slug })
      .select('id')
      .single();
    if (createError) {
      // Race: another creator may have created the same slug.
      const { data: again, error: againError } = await supabase
        .from('tags')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      throwOnError(againError ?? createError, 'Failed to create tag');
      if (again) {
        ids.push(again.id);
      }
      continue;
    }
    if (created) {
      ids.push(created.id);
    }
  }
  return ids;
}

async function uploadBlobWithRetry(params: {
  path: string;
  blob: Blob;
  contentType: string;
  signal?: AbortSignal;
  onAttempt?: (attempt: number) => void;
}): Promise<void> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= UPLOAD_MAX_ATTEMPTS; attempt += 1) {
    if (params.signal?.aborted) {
      throw new Error('Upload cancelled');
    }
    params.onAttempt?.(attempt);
    const { error } = await supabase.storage
      .from(DESIGN_IMAGES_BUCKET)
      .upload(params.path, params.blob, {
        upsert: true,
        contentType: params.contentType,
      });
    if (!error) {
      return;
    }
    lastError = new Error(error.message || 'Upload failed');
    if (attempt < UPLOAD_MAX_ATTEMPTS) {
      await sleep(UPLOAD_RETRY_BASE_MS * 2 ** (attempt - 1));
    }
  }
  throw lastError ?? new Error('Upload failed');
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Failed to read image file');
  }
  return response.blob();
}

export async function cleanupStoragePaths(paths: string[]): Promise<void> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0 || !isEnvConfigured()) {
    return;
  }
  try {
    await supabase.storage.from(DESIGN_IMAGES_BUCKET).remove(unique);
  } catch {
    // Best-effort cleanup — orphaned objects can be swept by a later job.
  }
}

export type UploadImagesCallbacks = {
  signal?: AbortSignal;
  onProgress?: (items: UploadImageProgress[]) => void;
};

export async function uploadDesignImages(params: {
  userId: string;
  designId: string;
  images: LocalUploadImage[];
  callbacks?: UploadImagesCallbacks;
}): Promise<{
  rows: Tables<'design_images'>[];
  progress: UploadImageProgress[];
  uploadedPaths: string[];
}> {
  assertEnvConfigured();
  const progress: UploadImageProgress[] = params.images.map((image) => ({
    localId: image.localId,
    status: 'pending',
    progress: 0,
    attempts: 0,
    error: null,
    remoteUrl: null,
    remoteThumbnailUrl: null,
    storagePath: null,
    thumbnailStoragePath: null,
  }));

  const emit = () => params.callbacks?.onProgress?.(progress.map((item) => ({ ...item })));
  emit();

  const uploadedPaths: string[] = [];
  const rows: Tables<'design_images'>[] = [];

  try {
    for (let index = 0; index < params.images.length; index += 1) {
      if (params.callbacks?.signal?.aborted) {
        throw new Error('Upload cancelled');
      }

      const image = params.images[index];
      if (!image) {
        continue;
      }
      const current = progress[index];
      if (!current) {
        continue;
      }

      const fileId = createUuid();
      const storagePath = buildDesignStoragePath(params.userId, params.designId, fileId, 'full');
      const thumbPath = buildDesignStoragePath(params.userId, params.designId, fileId, 'thumb');

      progress[index] = {
        ...current,
        status: 'uploading',
        progress: 0.1,
        storagePath,
        thumbnailStoragePath: thumbPath,
      };
      emit();

      const fullBlob = await uriToBlob(image.uri);
      await uploadBlobWithRetry({
        path: storagePath,
        blob: fullBlob,
        contentType: 'image/jpeg',
        signal: params.callbacks?.signal,
        onAttempt: (attempt) => {
          const row = progress[index];
          if (!row) {
            return;
          }
          progress[index] = {
            ...row,
            attempts: attempt,
            progress: Math.min(0.7, 0.15 + attempt * 0.15),
          };
          emit();
        },
      });
      uploadedPaths.push(storagePath);

      let remoteThumbnailUrl: string | null = null;
      const thumbSource = image.thumbnailUri ?? image.uri;
      try {
        const thumbBlob = await uriToBlob(thumbSource);
        await uploadBlobWithRetry({
          path: thumbPath,
          blob: thumbBlob,
          contentType: 'image/jpeg',
          signal: params.callbacks?.signal,
        });
        uploadedPaths.push(thumbPath);
        remoteThumbnailUrl = supabase.storage.from(DESIGN_IMAGES_BUCKET).getPublicUrl(thumbPath)
          .data.publicUrl;
      } catch {
        await cleanupStoragePaths([thumbPath]);
      }

      const remoteUrl = supabase.storage.from(DESIGN_IMAGES_BUCKET).getPublicUrl(storagePath)
        .data.publicUrl;

      const { data: row, error } = await supabase
        .from('design_images')
        .insert({
          design_id: params.designId,
          image_url: remoteUrl,
          thumbnail_url: remoteThumbnailUrl,
          width: image.width,
          height: image.height,
          sort_order: index,
        })
        .select('*')
        .single();
      throwOnError(error, 'Failed to save design image row');
      if (!row) {
        throw new Error('Failed to save design image row');
      }
      rows.push(row);

      const doneRow = progress[index];
      if (doneRow) {
        progress[index] = {
          ...doneRow,
          status: 'done',
          progress: 1,
          remoteUrl,
          remoteThumbnailUrl,
          error: null,
        };
      }
      emit();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    const cancelled = message.toLowerCase().includes('cancel');
    for (let i = 0; i < progress.length; i += 1) {
      const row = progress[i];
      if (row && row.status !== 'done') {
        progress[i] = {
          ...row,
          status: cancelled ? 'cancelled' : 'failed',
          error: cancelled ? 'Cancelled' : message,
        };
      }
    }
    emit();
    await cleanupStoragePaths(uploadedPaths);
    throw error instanceof Error ? error : new Error(message);
  }

  return { rows, progress, uploadedPaths };
}

export async function insertModerationFlags(params: {
  designId: string;
  safetyFlagged: boolean;
  duplicateFlagged: boolean;
  similarDesignIds: string[];
  similarityFlagged: boolean;
  details: Record<string, unknown>;
}): Promise<void> {
  if (!isEnvConfigured()) {
    return;
  }
  const rows: {
    design_id: string;
    kind: 'image_safety' | 'duplicate_image' | 'design_similarity';
    status: 'open';
    related_design_ids: string[];
    details: Json;
  }[] = [];

  if (params.safetyFlagged) {
    rows.push({
      design_id: params.designId,
      kind: 'image_safety',
      status: 'open',
      related_design_ids: [],
      details: params.details as Json,
    });
  }
  if (params.duplicateFlagged) {
    rows.push({
      design_id: params.designId,
      kind: 'duplicate_image',
      status: 'open',
      related_design_ids: [],
      details: params.details as Json,
    });
  }
  if (params.similarityFlagged && params.similarDesignIds.length > 0) {
    rows.push({
      design_id: params.designId,
      kind: 'design_similarity',
      status: 'open',
      related_design_ids: params.similarDesignIds,
      details: params.details as Json,
    });
  }

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from('design_moderation_flags').insert(rows);
  throwOnError(error, 'Failed to queue moderation review');
}

export async function publishOrUpdateDesign(
  input: PublishDesignInput,
  callbacks?: UploadImagesCallbacks,
): Promise<PublishedDesignResult> {
  assertEnvConfigured();
  const userId = await requireUserId();
  const categoryId = await resolveCategoryId(input.categorySlug);
  const editingId = input.editingDesignId ?? null;
  let designId = editingId ?? input.designId ?? null;
  let uploadedPaths: string[] = [];

  try {
    if (designId) {
      const { data: existing, error: existingError } = await supabase
        .from('designs')
        .select('id, creator_id')
        .eq('id', designId)
        .maybeSingle();
      throwOnError(existingError, 'Failed to load design');
      if (!existing || existing.creator_id !== userId) {
        throw new Error('You can only modify your own designs');
      }

      const { error: updateError } = await supabase
        .from('designs')
        .update({
          title: input.title.trim(),
          description: input.description.trim() || null,
          category_id: categoryId,
          platform: input.platform,
          industry: input.industry,
          provenance: input.provenance,
          source_url: input.sourceUrl,
          status: input.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', designId)
        .eq('creator_id', userId);
      throwOnError(updateError, 'Failed to update design');

      // Replace images when new locals were provided.
      if (input.images.length > 0) {
        const { data: oldImages } = await supabase
          .from('design_images')
          .select('image_url, thumbnail_url')
          .eq('design_id', designId);
        await supabase.from('design_images').delete().eq('design_id', designId);
        const upload = await uploadDesignImages({
          userId,
          designId,
          images: input.images,
          callbacks,
        });
        uploadedPaths = upload.uploadedPaths;
        void oldImages;
      }
    } else {
      const { data: created, error: createError } = await supabase
        .from('designs')
        .insert({
          creator_id: userId,
          title: input.title.trim(),
          description: input.description.trim() || null,
          category_id: categoryId,
          platform: input.platform,
          industry: input.industry,
          provenance: input.provenance,
          source_url: input.sourceUrl,
          status: input.status,
        })
        .select('id')
        .single();
      throwOnError(createError, 'Failed to create design');
      if (!created) {
        throw new Error('Failed to create design');
      }
      designId = created.id;

      const upload = await uploadDesignImages({
        userId,
        designId,
        images: input.images,
        callbacks,
      });
      uploadedPaths = upload.uploadedPaths;
    }

    const tagIds = await resolveTagIds(input.tags);
    await supabase.from('design_tags').delete().eq('design_id', designId);
    if (tagIds.length > 0) {
      const { error: tagError } = await supabase
        .from('design_tags')
        .insert(tagIds.map((tag_id) => ({ design_id: designId as string, tag_id })));
      throwOnError(tagError, 'Failed to save tags');
    }

    const { data: imageRows } = await supabase
      .from('design_images')
      .select('image_url')
      .eq('design_id', designId)
      .order('sort_order', { ascending: true });

    return {
      designId,
      imageUrls: (imageRows ?? []).map((row) => row.image_url),
      status: input.status,
    };
  } catch (error) {
    await cleanupStoragePaths(uploadedPaths);
    if (!editingId && designId && uploadedPaths.length > 0) {
      // Roll back orphan design created during a failed new publish.
      try {
        await supabase.from('designs').delete().eq('id', designId).eq('creator_id', userId);
      } catch {
        // ignore
      }
    }
    throw error;
  }
}

export async function deleteOwnDesign(designId: string): Promise<void> {
  assertEnvConfigured();
  const userId = await requireUserId();

  const { data: images } = await supabase
    .from('design_images')
    .select('image_url, thumbnail_url')
    .eq('design_id', designId);

  const { error } = await supabase.rpc('delete_own_design', { p_design_id: designId });
  throwOnError(error, 'Failed to delete design');

  const paths: string[] = [];
  for (const image of images ?? []) {
    const full = storagePathFromPublicUrl(image.image_url, userId);
    const thumb = image.thumbnail_url
      ? storagePathFromPublicUrl(image.thumbnail_url, userId)
      : null;
    if (full) {
      paths.push(full);
    }
    if (thumb) {
      paths.push(thumb);
    }
  }
  await cleanupStoragePaths(paths);
}

export function storagePathFromPublicUrl(url: string, userId: string): string | null {
  const marker = `/object/public/${DESIGN_IMAGES_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) {
    return null;
  }
  const path = decodeURIComponent(url.slice(index + marker.length).split('?')[0] ?? '');
  if (!path.startsWith(`${userId}/`)) {
    return null;
  }
  return path;
}

export async function fetchOwnDesignForEdit(designId: string): Promise<{
  id: string;
  title: string;
  description: string | null;
  categorySlug: string | null;
  platform: string | null;
  industry: string | null;
  provenance: DesignProvenance;
  sourceUrl: string | null;
  tags: string[];
  images: { id: string; imageUrl: string; thumbnailUrl: string | null; sortOrder: number }[];
} | null> {
  assertEnvConfigured();
  const userId = await requireUserId();
  const { data: design, error } = await supabase
    .from('designs')
    .select('*')
    .eq('id', designId)
    .eq('creator_id', userId)
    .maybeSingle();
  throwOnError(error, 'Failed to load design');
  if (!design) {
    return null;
  }

  const [{ data: category }, { data: images }, { data: tagRows }] = await Promise.all([
    design.category_id
      ? supabase.from('categories').select('slug').eq('id', design.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('design_images')
      .select('id, image_url, thumbnail_url, sort_order')
      .eq('design_id', designId)
      .order('sort_order', { ascending: true }),
    supabase.from('design_tags').select('tag_id').eq('design_id', designId),
  ]);

  let tags: string[] = [];
  if (tagRows && tagRows.length > 0) {
    const ids = tagRows.map((row) => row.tag_id);
    const { data: tagNames } = await supabase.from('tags').select('name, slug').in('id', ids);
    tags = (tagNames ?? []).map((tag) => tag.slug || tag.name);
  }

  return {
    id: design.id,
    title: design.title,
    description: design.description,
    categorySlug: category?.slug ?? null,
    platform: design.platform,
    industry: design.industry,
    provenance: design.provenance,
    sourceUrl: design.source_url,
    tags,
    images: (images ?? []).map((image) => ({
      id: image.id,
      imageUrl: image.image_url,
      thumbnailUrl: image.thumbnail_url,
      sortOrder: image.sort_order,
    })),
  };
}

export async function mockPublishDesign(input: PublishDesignInput): Promise<PublishedDesignResult> {
  await sleep(600);
  return {
    designId: input.editingDesignId ?? `mock-design-${Date.now()}`,
    imageUrls: input.images.map((image) => image.uri),
    status: input.status,
  };
}

export function toSimilarPreview(results: SimilarDesignResult[]): SimilarDesignResult[] {
  return results.slice(0, 6);
}
