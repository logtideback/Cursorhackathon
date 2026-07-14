import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  COLLECTIONS_QUERY_KEY,
  COLLECTION_DETAIL_QUERY_KEY,
} from '@/features/collections/constants';
import {
  getMockCollectionDetail,
  mockAddDesign,
  mockMoveDesign,
  mockRemoveDesign,
  mockReorder,
} from '@/features/collections/mock-data';
import type { CollectionDesignItem, CollectionDetail } from '@/features/collections/types';
import { track } from '@/lib/analytics';
import { isEnvConfigured } from '@/lib/env';
import {
  copyDesignToCollection,
  fetchCollectionDetail,
  moveDesignBetweenCollections,
  removeDesignFromCollection,
  reorderCollectionItems,
  updateCollectionItemDetails,
} from '@/services/collections';
import { useAuthStore } from '@/store/auth-store';
import type { SavedAspect } from '@/types/database';

export function useCollectionDetail(collectionId: string) {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const useMock = !isEnvConfigured() || collectionId.startsWith('mock-');

  const detailQuery = useQuery({
    queryKey: [COLLECTION_DETAIL_QUERY_KEY, collectionId, userId],
    queryFn: async () => {
      if (useMock) {
        return getMockCollectionDetail(collectionId);
      }
      return fetchCollectionDetail(collectionId, userId);
    },
    enabled: Boolean(collectionId),
    staleTime: 20_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [COLLECTION_DETAIL_QUERY_KEY, collectionId] });
    void queryClient.invalidateQueries({ queryKey: [COLLECTIONS_QUERY_KEY] });
  };

  const setDetail = (updater: (current: CollectionDetail) => CollectionDetail) => {
    queryClient.setQueryData<CollectionDetail | null>(
      [COLLECTION_DETAIL_QUERY_KEY, collectionId, userId],
      (current) => (current ? updater(current) : current),
    );
  };

  const removeMutation = useMutation({
    mutationFn: async (designId: string) => {
      if (useMock) {
        return mockRemoveDesign(collectionId, designId);
      }
      return removeDesignFromCollection(collectionId, designId);
    },
    onSuccess: (_data, designId) => {
      const isDefault = Boolean(detailQuery.data?.collection.is_default);
      track({
        name: 'design_removed_from_collection',
        properties: {
          designId,
          collectionId,
          source: 'detail',
        },
      });
      if (isDefault) {
        track({
          name: 'design_removed_from_saved',
          properties: {
            designId,
            collectionId,
            source: 'detail',
          },
        });
      }
    },
    onMutate: async (designId) => {
      await queryClient.cancelQueries({
        queryKey: [COLLECTION_DETAIL_QUERY_KEY, collectionId, userId],
      });
      const previous = queryClient.getQueryData<CollectionDetail | null>([
        COLLECTION_DETAIL_QUERY_KEY,
        collectionId,
        userId,
      ]);
      if (previous) {
        setDetail((current) => ({
          ...current,
          items: current.items.filter((item) => item.designId !== designId),
        }));
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [COLLECTION_DETAIL_QUERY_KEY, collectionId, userId],
          context.previous,
        );
      }
    },
    onSettled: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedItemIds: string[]) => {
      if (useMock) {
        mockReorder(collectionId, orderedItemIds);
        return true;
      }
      return reorderCollectionItems(collectionId, orderedItemIds);
    },
    onMutate: async (orderedItemIds) => {
      await queryClient.cancelQueries({
        queryKey: [COLLECTION_DETAIL_QUERY_KEY, collectionId, userId],
      });
      const previous = queryClient.getQueryData<CollectionDetail | null>([
        COLLECTION_DETAIL_QUERY_KEY,
        collectionId,
        userId,
      ]);
      if (previous) {
        const byId = new Map(previous.items.map((item) => [item.itemId, item]));
        const nextItems: CollectionDesignItem[] = orderedItemIds
          .map((id, index) => {
            const item = byId.get(id);
            return item ? { ...item, sortOrder: index } : null;
          })
          .filter((item): item is CollectionDesignItem => item !== null);
        setDetail((current) => ({ ...current, items: nextItems }));
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [COLLECTION_DETAIL_QUERY_KEY, collectionId, userId],
          context.previous,
        );
      }
    },
    onSettled: invalidate,
  });

  const moveMutation = useMutation({
    mutationFn: async (params: { designId: string; toCollectionId: string }) => {
      if (useMock) {
        mockMoveDesign({
          fromCollectionId: collectionId,
          toCollectionId: params.toCollectionId,
          designId: params.designId,
        });
        return true;
      }
      await moveDesignBetweenCollections({
        fromCollectionId: collectionId,
        toCollectionId: params.toCollectionId,
        designId: params.designId,
      });
      return true;
    },
    onSuccess: invalidate,
  });

  const copyMutation = useMutation({
    mutationFn: async (params: { designId: string; toCollectionId: string }) => {
      if (useMock) {
        mockAddDesign({
          collectionId: params.toCollectionId,
          designId: params.designId,
        });
        return true;
      }
      await copyDesignToCollection({
        collectionId: params.toCollectionId,
        designId: params.designId,
      });
      return true;
    },
    onSuccess: invalidate,
  });

  const updateItemMutation = useMutation({
    mutationFn: async (params: {
      designId: string;
      note?: string | null;
      savedAspect?: SavedAspect | null;
    }) => {
      if (useMock) {
        mockAddDesign({
          collectionId,
          designId: params.designId,
          note: params.note,
          savedAspect: params.savedAspect,
        });
        return true;
      }
      await updateCollectionItemDetails({
        collectionId,
        designId: params.designId,
        note: params.note,
        savedAspect: params.savedAspect,
      });
      return true;
    },
    onSuccess: invalidate,
  });

  return {
    detail: detailQuery.data ?? null,
    isLoading: detailQuery.isLoading,
    error: detailQuery.error,
    refetch: detailQuery.refetch,
    removeMutation,
    reorderMutation,
    moveMutation,
    copyMutation,
    updateItemMutation,
  };
}
