import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  COLLECTIONS_QUERY_KEY,
  COLLECTION_DETAIL_QUERY_KEY,
} from '@/features/collections/constants';
import {
  getMockCollectionSummaries,
  mockCreateCollection,
  mockDeleteCollection,
  mockUpdateCollection,
} from '@/features/collections/mock-data';
import type { CreateCollectionInput, UpdateCollectionInput } from '@/features/collections/types';
import { isEnvConfigured } from '@/lib/env';
import {
  createCollection,
  deleteCollection,
  fetchCollectionSummaries,
  updateCollection,
} from '@/services/collections';
import { useAuthStore } from '@/store/auth-store';

export function useCollectionsOverview() {
  const userId = useAuthStore((s) => s.user?.id);
  const useMock = !isEnvConfigured();

  const query = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'overview', userId],
    queryFn: async () => {
      if (useMock) {
        return getMockCollectionSummaries();
      }
      if (!userId) {
        throw new Error('Not authenticated');
      }
      return fetchCollectionSummaries(userId);
    },
    enabled: useMock || Boolean(userId),
    staleTime: 30_000,
  });

  return {
    collections: query.data ?? [],
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching && !query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCollectionMutations() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const useMock = !isEnvConfigured();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [COLLECTIONS_QUERY_KEY] });
    void queryClient.invalidateQueries({ queryKey: [COLLECTION_DETAIL_QUERY_KEY] });
  };

  const createMutation = useMutation({
    mutationFn: async (input: CreateCollectionInput) => {
      if (useMock) {
        return mockCreateCollection(input);
      }
      if (!userId) {
        throw new Error('Not authenticated');
      }
      return createCollection(userId, input);
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async (params: { collectionId: string; input: UpdateCollectionInput }) => {
      if (useMock) {
        return mockUpdateCollection(params.collectionId, params.input);
      }
      return updateCollection(params.collectionId, params.input);
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      if (useMock) {
        mockDeleteCollection(collectionId);
        return true;
      }
      await deleteCollection(collectionId);
      return true;
    },
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation, invalidate };
}
