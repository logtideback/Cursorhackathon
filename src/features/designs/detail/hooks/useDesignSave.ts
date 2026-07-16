import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  COLLECTIONS_QUERY_KEY,
  DESIGN_DETAIL_QUERY_KEY,
  DESIGN_SAVES_QUERY_KEY,
} from '@/features/designs/detail/constants';
import type { DesignSaveState } from '@/features/designs/detail/types';
import { isMockDesignId } from '@/features/discover/data/mock-designs';
import { isEnvConfigured } from '@/lib/env';
import {
  addDesignToCollection,
  fetchCollections,
  fetchDesignSaveState,
  removeDesignFromCollection,
  updateCollectionItemDetails,
} from '@/services/collections';
import { useAuthStore } from '@/store/auth-store';
import type { SavedAspect } from '@/types/database';

const mockSaveStore = new Map<string, DesignSaveState>();

function getMockSaveState(designId: string): DesignSaveState {
  return (
    mockSaveStore.get(designId) ?? {
      isSaved: false,
      entries: [],
      defaultCollection: {
        id: 'mock-saved',
        user_id: 'mock-user',
        name: 'Saved',
        description: 'Default collection',
        cover_image_url: null,
        is_default: true,
        is_private: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }
  );
}

function setMockSaveState(designId: string, state: DesignSaveState) {
  mockSaveStore.set(designId, state);
}

export function useDesignSave(designId: string) {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const useMock = isMockDesignId(designId) || !isEnvConfigured();

  const saveQuery = useQuery({
    queryKey: [DESIGN_SAVES_QUERY_KEY, designId, userId],
    queryFn: async () => {
      if (useMock) {
        return getMockSaveState(designId);
      }
      if (!userId) {
        throw new Error('Not authenticated');
      }
      return fetchDesignSaveState(userId, designId);
    },
    enabled: Boolean(designId) && (useMock || Boolean(userId)),
    staleTime: 30_000,
  });

  const collectionsQuery = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, userId],
    queryFn: async () => {
      if (useMock) {
        const state = getMockSaveState(designId);
        return state.defaultCollection ? [state.defaultCollection] : [];
      }
      return fetchCollections(userId);
    },
    enabled: useMock || Boolean(userId),
    staleTime: 60_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [DESIGN_SAVES_QUERY_KEY, designId] });
    void queryClient.invalidateQueries({ queryKey: [COLLECTIONS_QUERY_KEY] });
    void queryClient.invalidateQueries({ queryKey: [DESIGN_DETAIL_QUERY_KEY, designId] });
  };

  const saveMutation = useMutation({
    mutationFn: async (params: {
      collectionId?: string;
      note?: string | null;
      savedAspect?: SavedAspect | null;
    }) => {
      if (useMock) {
        const current = getMockSaveState(designId);
        const collectionId = params.collectionId ?? current.defaultCollection?.id ?? 'mock-saved';
        const collectionName =
          collectionsQuery.data?.find((c) => c.id === collectionId)?.name ?? 'Saved';
        const isDefault = collectionId === current.defaultCollection?.id;
        const existing = current.entries.filter((entry) => entry.collectionId !== collectionId);
        const next: DesignSaveState = {
          ...current,
          isSaved: true,
          entries: [
            ...existing,
            {
              collectionId,
              collectionName,
              isDefault,
              note: params.note ?? null,
              savedAspect: params.savedAspect ?? null,
              itemId: `mock-item-${collectionId}`,
            },
          ],
        };
        setMockSaveState(designId, next);
        return next;
      }

      const state = saveQuery.data;
      const collectionId =
        params.collectionId ?? state?.defaultCollection?.id ?? collectionsQuery.data?.[0]?.id;
      if (!collectionId) {
        throw new Error('No collection available to save into');
      }
      await addDesignToCollection({
        collectionId,
        designId,
        note: params.note,
        savedAspect: params.savedAspect,
      });
      return collectionId;
    },
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      if (useMock) {
        const current = getMockSaveState(designId);
        const entries = current.entries.filter((entry) => entry.collectionId !== collectionId);
        setMockSaveState(designId, {
          ...current,
          isSaved: entries.length > 0,
          entries,
        });
        return true;
      }
      return removeDesignFromCollection(collectionId, designId);
    },
    onSuccess: invalidate,
  });

  const updateDetailsMutation = useMutation({
    mutationFn: async (params: {
      collectionId: string;
      note?: string | null;
      savedAspect?: SavedAspect | null;
    }) => {
      if (useMock) {
        const current = getMockSaveState(designId);
        setMockSaveState(designId, {
          ...current,
          entries: current.entries.map((entry) =>
            entry.collectionId === params.collectionId
              ? {
                  ...entry,
                  note: params.note ?? null,
                  savedAspect: params.savedAspect ?? null,
                }
              : entry,
          ),
        });
        return true;
      }
      await updateCollectionItemDetails({
        collectionId: params.collectionId,
        designId,
        note: params.note,
        savedAspect: params.savedAspect,
      });
      return true;
    },
    onSuccess: invalidate,
  });

  return {
    saveState: saveQuery.data,
    isLoading: saveQuery.isLoading,
    collections: collectionsQuery.data ?? [],
    saveMutation,
    removeMutation,
    updateDetailsMutation,
    refetch: saveQuery.refetch,
  };
}
