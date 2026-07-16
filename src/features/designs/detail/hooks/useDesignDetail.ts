import NetInfo from '@react-native-community/netinfo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  DESIGN_DETAIL_QUERY_KEY,
  DESIGN_SAVES_QUERY_KEY,
  FOLLOW_QUERY_KEY,
  SIMILAR_DESIGNS_LIMIT,
  SIMILAR_DESIGNS_QUERY_KEY,
} from '@/features/designs/detail/constants';
import { getMockDesignDetail, getMockSimilarDesigns } from '@/features/designs/detail/mock-detail';
import type {
  DesignDetail,
  DesignDetailErrorKind,
  SimilarDesignCard,
} from '@/features/designs/detail/types';
import { isMockDesignId } from '@/features/discover/data/mock-designs';
import { isEnvConfigured } from '@/lib/env';
import {
  countPublishedDesigns,
  fetchDesignDetail,
  fetchSimilarDesigns,
  incrementDesignViewCount,
  mapUnseenToSimilar,
} from '@/services/designs';
import { followCreator, unfollowCreator } from '@/services/social';
import { useAuthStore } from '@/store/auth-store';

function classifyError(error: unknown, offline: boolean): DesignDetailErrorKind {
  if (offline) {
    return 'offline';
  }
  if (error instanceof Error) {
    if (error.name === 'PermissionError' || error.message === 'permission_denied') {
      return 'permission';
    }
  }
  return 'unknown';
}

async function loadDesignDetail(designId: string): Promise<DesignDetail | null> {
  if (isMockDesignId(designId) || !isEnvConfigured()) {
    return getMockDesignDetail(designId);
  }
  return fetchDesignDetail(designId);
}

async function loadSimilar(designId: string): Promise<SimilarDesignCard[]> {
  if (isMockDesignId(designId) || !isEnvConfigured()) {
    return getMockSimilarDesigns(designId, SIMILAR_DESIGNS_LIMIT);
  }
  const rows = await fetchSimilarDesigns(designId, SIMILAR_DESIGNS_LIMIT);
  return mapUnseenToSimilar(rows).filter((card) => card.id !== designId);
}

export function useDesignDetail(designId: string) {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return unsubscribe;
  }, []);

  const detailQuery = useQuery({
    queryKey: [DESIGN_DETAIL_QUERY_KEY, designId],
    queryFn: () => loadDesignDetail(designId),
    enabled: Boolean(designId),
    staleTime: 60_000,
  });

  const similarQuery = useQuery({
    queryKey: [SIMILAR_DESIGNS_QUERY_KEY, designId],
    queryFn: () => loadSimilar(designId),
    enabled: Boolean(designId) && Boolean(detailQuery.data),
    staleTime: 120_000,
  });

  useEffect(() => {
    if (!designId || !detailQuery.data || detailQuery.data.source === 'mock') {
      return;
    }
    void incrementDesignViewCount(designId).catch(() => {
      // View count is best-effort; never block the detail screen.
    });
  }, [designId, detailQuery.data]);

  const followMutation = useMutation({
    mutationFn: async (nextFollowing: boolean) => {
      const creatorId = detailQuery.data?.creator.id;
      if (!creatorId) {
        throw new Error('Creator unavailable');
      }
      if (nextFollowing) {
        await followCreator(creatorId);
      } else {
        await unfollowCreator(creatorId);
      }
      return nextFollowing;
    },
    onMutate: async (nextFollowing) => {
      await queryClient.cancelQueries({ queryKey: [DESIGN_DETAIL_QUERY_KEY, designId] });
      const previous = queryClient.getQueryData<DesignDetail | null>([
        DESIGN_DETAIL_QUERY_KEY,
        designId,
      ]);
      if (previous) {
        queryClient.setQueryData<DesignDetail>([DESIGN_DETAIL_QUERY_KEY, designId], {
          ...previous,
          creator: { ...previous.creator, isFollowing: nextFollowing },
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([DESIGN_DETAIL_QUERY_KEY, designId], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [DESIGN_DETAIL_QUERY_KEY, designId] });
      void queryClient.invalidateQueries({ queryKey: [FOLLOW_QUERY_KEY] });
    },
  });

  const design = detailQuery.data ?? null;
  const errorKind: DesignDetailErrorKind | null = (() => {
    if (detailQuery.isLoading) {
      return null;
    }
    if (offline && !design && detailQuery.isError) {
      return 'offline';
    }
    if (detailQuery.isError) {
      return classifyError(detailQuery.error, offline);
    }
    if (!design) {
      return 'deleted';
    }
    if (design.creator.accountStatus === 'suspended') {
      return 'suspended_creator';
    }
    return null;
  })();

  return {
    design,
    isLoading: detailQuery.isLoading,
    isRefreshing: detailQuery.isFetching && !detailQuery.isLoading,
    offline,
    errorKind,
    error: detailQuery.error,
    refetch: detailQuery.refetch,
    similar: similarQuery.data ?? [],
    similarLoading: similarQuery.isLoading,
    similarError: similarQuery.isError,
    refetchSimilar: similarQuery.refetch,
    followMutation,
    userId,
  };
}

export function useCreatorPublishedCount(creatorId: string | undefined) {
  return useQuery({
    queryKey: ['creator-published-count', creatorId],
    queryFn: () => countPublishedDesigns(creatorId!),
    enabled: Boolean(creatorId) && isEnvConfigured(),
  });
}

export { DESIGN_SAVES_QUERY_KEY };
