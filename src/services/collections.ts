import { assertEnvConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { SavedAspect, Tables } from '@/types/database';

import type { DesignSaveEntry, DesignSaveState } from '@/features/designs/detail/types';

function throwOnError(error: { message: string } | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
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
