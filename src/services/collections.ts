import { resolveCoverSources } from '@/features/collections/cover';
import type {
  ChooseCollectionOption,
  CollectionDesignItem,
  CollectionDetail,
  CollectionSummary,
  CreateCollectionInput,
  PublicCollectionPayload,
  UpdateCollectionInput,
} from '@/features/collections/types';
import type { DesignSaveEntry, DesignSaveState } from '@/features/designs/detail/types';
import { assertEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { SavedAspect, Tables } from '@/types/database';

function throwOnError(error: { message: string } | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

function friendlyDuplicateError(error: { message: string } | null): Error {
  const message = error?.message ?? 'Failed to save collection';
  if (
    message.toLowerCase().includes('collections_user_lower_name_uidx') ||
    message.toLowerCase().includes('duplicate key')
  ) {
    return new Error('A collection with this name already exists.');
  }
  return new Error(message);
}

export async function fetchCollections(userId?: string): Promise<Tables<'collections'>[]> {
  assertEnvConfigured();

  let query = supabase.from('collections').select('*').order('created_at', { ascending: true });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  throwOnError(error, 'Failed to fetch collections');
  return data ?? [];
}

export async function fetchDefaultCollection(
  userId: string,
): Promise<Tables<'collections'> | null> {
  assertEnvConfigured();
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .maybeSingle();

  throwOnError(error, 'Failed to fetch default collection');
  return data;
}

export async function fetchCollectionItems(
  collectionId: string,
): Promise<Tables<'collection_items'>[]> {
  assertEnvConfigured();
  const { data, error } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  throwOnError(error, 'Failed to fetch collection items');
  return data ?? [];
}

export async function fetchCollectionSummaries(userId: string): Promise<CollectionSummary[]> {
  assertEnvConfigured();

  const { data: collections, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('updated_at', { ascending: false });

  throwOnError(error, 'Failed to fetch collections');
  const list = collections ?? [];
  if (list.length === 0) {
    return [];
  }

  const ids = list.map((collection) => collection.id);
  const { data: items, error: itemsError } = await supabase
    .from('collection_items')
    .select('id, collection_id, design_id, sort_order, created_at')
    .in('collection_id', ids)
    .order('sort_order', { ascending: true });

  throwOnError(itemsError, 'Failed to fetch collection items');

  const designIds = [...new Set((items ?? []).map((item) => item.design_id))];
  const imageByDesign = new Map<string, string>();

  if (designIds.length > 0) {
    const { data: images, error: imagesError } = await supabase
      .from('design_images')
      .select('design_id, image_url, thumbnail_url, sort_order')
      .in('design_id', designIds)
      .order('sort_order', { ascending: true });
    throwOnError(imagesError, 'Failed to fetch design images');

    for (const image of images ?? []) {
      if (!imageByDesign.has(image.design_id)) {
        imageByDesign.set(image.design_id, image.thumbnail_url ?? image.image_url);
      }
    }
  }

  const itemsByCollection = new Map<string, typeof items>();
  for (const item of items ?? []) {
    const bucket = itemsByCollection.get(item.collection_id) ?? [];
    bucket.push(item);
    itemsByCollection.set(item.collection_id, bucket);
  }

  return list.map((collection) => {
    const collectionItems = itemsByCollection.get(collection.id) ?? [];
    const mosaicUrls = resolveCoverSources({
      customCoverUrl: collection.cover_image_url,
      itemImageUrls: collectionItems.map((item) => imageByDesign.get(item.design_id) ?? null),
    });
    return {
      ...collection,
      designCount: collectionItems.length,
      mosaicUrls,
    };
  });
}

export async function fetchCollectionDetail(
  collectionId: string,
  userId?: string,
): Promise<CollectionDetail | null> {
  assertEnvConfigured();

  const { data: collection, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .maybeSingle();

  throwOnError(error, 'Failed to fetch collection');
  if (!collection) {
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  throwOnError(itemsError, 'Failed to fetch collection items');
  const list = items ?? [];
  const designIds = list.map((item) => item.design_id);

  const designsById = new Map<
    string,
    { title: string; status: string; imageUrl: string | null; thumbnailUrl: string | null }
  >();

  if (designIds.length > 0) {
    const { data: designs, error: designsError } = await supabase
      .from('designs')
      .select('id, title, status')
      .in('id', designIds);
    throwOnError(designsError, 'Failed to fetch designs');

    const { data: images, error: imagesError } = await supabase
      .from('design_images')
      .select('design_id, image_url, thumbnail_url, sort_order')
      .in('design_id', designIds)
      .order('sort_order', { ascending: true });
    throwOnError(imagesError, 'Failed to fetch design images');

    const imageMap = new Map<string, { imageUrl: string; thumbnailUrl: string | null }>();
    for (const image of images ?? []) {
      if (!imageMap.has(image.design_id)) {
        imageMap.set(image.design_id, {
          imageUrl: image.image_url,
          thumbnailUrl: image.thumbnail_url,
        });
      }
    }

    for (const design of designs ?? []) {
      const image = imageMap.get(design.id);
      designsById.set(design.id, {
        title: design.title,
        status: design.status,
        imageUrl: image?.imageUrl ?? null,
        thumbnailUrl: image?.thumbnailUrl ?? null,
      });
    }
  }

  const mapped: CollectionDesignItem[] = list.map((item) => {
    const design = designsById.get(item.design_id);
    const unavailable =
      !design || design.status === 'removed' || design.status === 'archived' || !design.imageUrl;
    return {
      itemId: item.id,
      designId: item.design_id,
      note: item.note,
      savedAspect: item.saved_aspect,
      sortOrder: item.sort_order,
      createdAt: item.created_at,
      title: design?.title ?? null,
      imageUrl: design?.imageUrl ?? null,
      thumbnailUrl: design?.thumbnailUrl ?? null,
      unavailable,
    };
  });

  return {
    collection,
    items: mapped,
    isOwner: Boolean(userId && collection.user_id === userId),
  };
}

export async function fetchChooserOptions(
  userId: string,
  designId: string,
): Promise<ChooseCollectionOption[]> {
  const summaries = await fetchCollectionSummaries(userId);
  const { data: containing, error } = await supabase
    .from('collection_items')
    .select('collection_id')
    .eq('design_id', designId)
    .in(
      'collection_id',
      summaries.map((summary) => summary.id),
    );

  throwOnError(error, 'Failed to resolve containing collections');
  const containingIds = new Set((containing ?? []).map((row) => row.collection_id));

  return summaries
    .slice()
    .sort((a, b) => {
      if (a.is_default !== b.is_default) {
        return a.is_default ? -1 : 1;
      }
      return b.updated_at.localeCompare(a.updated_at);
    })
    .map((summary) => ({
      id: summary.id,
      name: summary.name,
      isDefault: summary.is_default,
      isPrivate: summary.is_private,
      containsDesign: containingIds.has(summary.id),
      updatedAt: summary.updated_at,
      mosaicUrls: summary.mosaicUrls,
    }));
}

export async function createCollection(
  userId: string,
  input: CreateCollectionInput,
): Promise<Tables<'collections'>> {
  assertEnvConfigured();
  const { data, error } = await supabase
    .from('collections')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      is_private: input.isPrivate,
      cover_image_url: input.coverImageUrl ?? null,
      is_default: false,
    })
    .select('*')
    .single();

  if (error) {
    throw friendlyDuplicateError(error);
  }
  if (!data) {
    throw new Error('Failed to create collection');
  }
  return data;
}

export async function updateCollection(
  collectionId: string,
  input: UpdateCollectionInput,
): Promise<Tables<'collections'>> {
  assertEnvConfigured();
  const { data, error } = await supabase
    .from('collections')
    .update({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.isPrivate !== undefined ? { is_private: input.isPrivate } : {}),
      ...(input.coverImageUrl !== undefined ? { cover_image_url: input.coverImageUrl } : {}),
    })
    .eq('id', collectionId)
    .select('*')
    .single();

  if (error) {
    throw friendlyDuplicateError(error);
  }
  if (!data) {
    throw new Error('Failed to update collection');
  }
  return data;
}

export async function deleteCollection(collectionId: string): Promise<void> {
  assertEnvConfigured();
  const { error } = await supabase.from('collections').delete().eq('id', collectionId);
  throwOnError(error, 'Failed to delete collection');
}

export async function addDesignToCollection(params: {
  collectionId: string;
  designId: string;
  note?: string | null;
  savedAspect?: SavedAspect | null;
}): Promise<Tables<'collection_items'>> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('add_design_to_collection', {
    p_collection_id: params.collectionId,
    p_design_id: params.designId,
    p_note: params.note ?? null,
    p_saved_aspect: params.savedAspect ?? null,
  });

  if (error) {
    throw new Error(error.message || 'Failed to add design to collection');
  }
  if (!data) {
    throw new Error('Failed to add design to collection');
  }
  return data;
}

export async function removeDesignFromCollection(
  collectionId: string,
  designId: string,
): Promise<boolean> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('remove_design_from_collection', {
    p_collection_id: collectionId,
    p_design_id: designId,
  });

  if (error) {
    throw new Error(error.message || 'Failed to remove design from collection');
  }
  return Boolean(data);
}

export async function updateCollectionItemDetails(params: {
  collectionId: string;
  designId: string;
  note?: string | null;
  savedAspect?: SavedAspect | null;
}): Promise<Tables<'collection_items'>> {
  assertEnvConfigured();
  const { data, error } = await supabase
    .from('collection_items')
    .update({
      note: params.note ?? null,
      saved_aspect: params.savedAspect ?? null,
    })
    .eq('collection_id', params.collectionId)
    .eq('design_id', params.designId)
    .select('*')
    .single();

  throwOnError(error, 'Failed to update collection item');
  if (!data) {
    throw new Error('Failed to update collection item');
  }
  return data;
}

export async function reorderCollectionItems(
  collectionId: string,
  orderedItemIds: string[],
): Promise<boolean> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('reorder_collection_items', {
    p_collection_id: collectionId,
    p_ordered_item_ids: orderedItemIds,
  });
  if (error) {
    throw new Error(error.message || 'Failed to reorder collection');
  }
  return Boolean(data);
}

export async function moveDesignBetweenCollections(params: {
  fromCollectionId: string;
  toCollectionId: string;
  designId: string;
  note?: string | null;
  savedAspect?: SavedAspect | null;
}): Promise<Tables<'collection_items'>> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('move_design_between_collections', {
    p_from_collection_id: params.fromCollectionId,
    p_to_collection_id: params.toCollectionId,
    p_design_id: params.designId,
    p_note: params.note ?? null,
    p_saved_aspect: params.savedAspect ?? null,
  });
  if (error) {
    throw new Error(error.message || 'Failed to move design');
  }
  if (!data) {
    throw new Error('Failed to move design');
  }
  return data;
}

export async function copyDesignToCollection(params: {
  collectionId: string;
  designId: string;
  note?: string | null;
  savedAspect?: SavedAspect | null;
}): Promise<Tables<'collection_items'>> {
  return addDesignToCollection(params);
}

export async function fetchPublicCollection(
  collectionId: string,
): Promise<PublicCollectionPayload | null> {
  assertEnvConfigured();
  const { data, error } = await supabase.rpc('get_public_collection', {
    p_collection_id: collectionId,
  });
  if (error) {
    throw new Error(error.message || 'Failed to fetch public collection');
  }
  if (!data) {
    return null;
  }
  return data as unknown as PublicCollectionPayload;
}

export async function uploadCollectionCover(
  localUri: string,
  userId: string,
  collectionId: string,
): Promise<string> {
  assertEnvConfigured();
  const extension = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/${collectionId}/cover.${extension === 'png' ? 'png' : 'jpg'}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from('collection-covers').upload(path, blob, {
    upsert: true,
    contentType: blob.type || 'image/jpeg',
  });
  throwOnError(error, 'Failed to upload cover image');

  const { data } = supabase.storage.from('collection-covers').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

/** Resolve whether a design is saved and which collections contain it. */
export async function fetchDesignSaveState(
  userId: string,
  designId: string,
): Promise<DesignSaveState> {
  assertEnvConfigured();

  const { data: collections, error: collectionsError } = await supabase
    .from('collections')
    .select('id, name, is_default')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  throwOnError(collectionsError, 'Failed to fetch collections');
  const list = collections ?? [];
  const defaultCollection = await fetchDefaultCollection(userId);

  if (list.length === 0) {
    return {
      isSaved: false,
      entries: [],
      defaultCollection,
    };
  }

  const collectionIds = list.map((collection) => collection.id);
  const { data: items, error: itemsError } = await supabase
    .from('collection_items')
    .select('id, collection_id, note, saved_aspect')
    .eq('design_id', designId)
    .in('collection_id', collectionIds);

  throwOnError(itemsError, 'Failed to fetch saved design state');

  const byId = new Map(list.map((collection) => [collection.id, collection]));
  const entries: DesignSaveEntry[] = (items ?? [])
    .map((item) => {
      const collection = byId.get(item.collection_id);
      if (!collection) {
        return null;
      }
      return {
        collectionId: collection.id,
        collectionName: collection.name,
        isDefault: collection.is_default,
        note: item.note,
        savedAspect: item.saved_aspect,
        itemId: item.id,
      };
    })
    .filter((entry): entry is DesignSaveEntry => entry !== null);

  return {
    isSaved: entries.length > 0,
    entries,
    defaultCollection,
  };
}
