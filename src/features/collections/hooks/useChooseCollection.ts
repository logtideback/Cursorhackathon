import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import {
  COLLECTION_CHOOSER_QUERY_KEY,
  COLLECTION_DETAIL_QUERY_KEY,
  COLLECTIONS_QUERY_KEY,
} from '@/features/collections/constants';
import {
  mockAddDesign,
  mockChooserOptions,
  mockCreateCollection,
  mockRemoveDesign,
} from '@/features/collections/mock-data';
import type { ChooseCollectionOption, CreateCollectionInput } from '@/features/collections/types';
import { DESIGN_SAVES_QUERY_KEY } from '@/features/designs/detail/constants';
import { isEnvConfigured } from '@/lib/env';
import {
  addDesignToCollection,
  createCollection,
  fetchChooserOptions,
  removeDesignFromCollection,
} from '@/services/collections';
import { useAuthStore } from '@/store/auth-store';

export function useChooseCollection(designId: string | null) {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const useMock = !isEnvConfigured() || Boolean(designId?.startsWith('mock-'));
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  const query = useQuery({
    queryKey: [COLLECTION_CHOOSER_QUERY_KEY, designId, userId],
    queryFn: async () => {
      if (!designId) {
        return [] as ChooseCollectionOption[];
      }
      if (useMock) {
        return mockChooserOptions(designId);
      }
      if (!userId) {
        throw new Error('Not authenticated');
      }
      return fetchChooserOptions(userId, designId);
    },
    enabled: Boolean(designId) && (useMock || Boolean(userId)),
    staleTime: 15_000,
  });

  const options = useMemo(() => {
    const list = query.data ?? [];
    return list.slice().sort((a, b) => {
      // Recent collections first (updated_at), default stays visible near top via updated_at touch.
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [query.data]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [COLLECTION_CHOOSER_QUERY_KEY] });
    void queryClient.invalidateQueries({ queryKey: [COLLECTIONS_QUERY_KEY] });
    void queryClient.invalidateQueries({ queryKey: [COLLECTION_DETAIL_QUERY_KEY] });
    if (designId) {
      void queryClient.invalidateQueries({ queryKey: [DESIGN_SAVES_QUERY_KEY, designId] });
    }
  };

  const toggleMutation = useMutation({
    mutationFn: async (params: { collectionId: string; shouldContain: boolean }) => {
      if (!designId) {
        throw new Error('Missing design');
      }
      if (useMock) {
        if (params.shouldContain) {
          mockAddDesign({ collectionId: params.collectionId, designId });
        } else {
          mockRemoveDesign(params.collectionId, designId);
        }
        return params;
      }
      if (params.shouldContain) {
        await addDesignToCollection({
          collectionId: params.collectionId,
          designId,
        });
      } else {
        await removeDesignFromCollection(params.collectionId, designId);
      }
      return params;
    },
    onMutate: async (params) => {
      if (!designId) {
        return { previous: undefined };
      }
      setPendingIds((ids) => [...ids, params.collectionId]);
      await queryClient.cancelQueries({
        queryKey: [COLLECTION_CHOOSER_QUERY_KEY, designId, userId],
      });
      const previous = queryClient.getQueryData<ChooseCollectionOption[]>([
        COLLECTION_CHOOSER_QUERY_KEY,
        designId,
        userId,
      ]);
      queryClient.setQueryData<ChooseCollectionOption[]>(
        [COLLECTION_CHOOSER_QUERY_KEY, designId, userId],
        (current) =>
          (current ?? []).map((option) =>
            option.id === params.collectionId
              ? { ...option, containsDesign: params.shouldContain }
              : option,
          ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (designId && context?.previous) {
        queryClient.setQueryData(
          [COLLECTION_CHOOSER_QUERY_KEY, designId, userId],
          context.previous,
        );
      }
    },
    onSettled: (_data, _error, vars) => {
      setPendingIds((ids) => ids.filter((id) => id !== vars.collectionId));
      invalidate();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateCollectionInput) => {
      if (useMock) {
        const created = mockCreateCollection(input);
        if (designId) {
          mockAddDesign({ collectionId: created.id, designId });
        }
        return created;
      }
      if (!userId) {
        throw new Error('Not authenticated');
      }
      const created = await createCollection(userId, input);
      if (designId) {
        await addDesignToCollection({ collectionId: created.id, designId });
      }
      return created;
    },
    onSuccess: invalidate,
  });

  return {
    options,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    toggleMutation,
    createMutation,
    pendingIds,
  };
}
