import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CREATOR_PROFILE_QUERY_KEY } from '@/features/creators/constants';
import { getMockCreatorProfile } from '@/features/creators/mock';
import type { CreatorProfile } from '@/features/creators/types';
import { isEnvConfigured } from '@/lib/env';
import { fetchCreatorProfile, reportCreator } from '@/services/creators';
import { blockCreator, followCreator, unblockCreator, unfollowCreator } from '@/services/social';
import type { ReportReason } from '@/types/database';

export function useCreatorProfile(creatorId: string, viewerId?: string | null) {
  const queryClient = useQueryClient();
  const useMock = !isEnvConfigured();

  const query = useQuery({
    queryKey: [CREATOR_PROFILE_QUERY_KEY, creatorId, useMock ? 'mock' : 'remote'],
    enabled: Boolean(creatorId),
    queryFn: async (): Promise<CreatorProfile> => {
      if (useMock) {
        return getMockCreatorProfile(creatorId, viewerId ?? undefined);
      }
      const profile = await fetchCreatorProfile(creatorId);
      if (!profile) {
        throw new Error('Creator not found');
      }
      return profile;
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [CREATOR_PROFILE_QUERY_KEY, creatorId] });

  const followMutation = useMutation({
    mutationFn: async (shouldFollow: boolean) => {
      if (useMock) {
        return shouldFollow;
      }
      if (shouldFollow) {
        await followCreator(creatorId);
      } else {
        await unfollowCreator(creatorId);
      }
      return shouldFollow;
    },
    onSuccess: async (isFollowing) => {
      queryClient.setQueryData<CreatorProfile>(
        [CREATOR_PROFILE_QUERY_KEY, creatorId, useMock ? 'mock' : 'remote'],
        (current) =>
          current
            ? {
                ...current,
                isFollowing,
                followerCount: Math.max(0, current.followerCount + (isFollowing ? 1 : -1)),
              }
            : current,
      );
      await invalidate();
    },
  });

  const blockMutation = useMutation({
    mutationFn: async (shouldBlock: boolean) => {
      if (useMock) {
        return shouldBlock;
      }
      if (shouldBlock) {
        await blockCreator(creatorId);
      } else {
        await unblockCreator(creatorId);
      }
      return shouldBlock;
    },
    onSuccess: async (isBlocking) => {
      queryClient.setQueryData<CreatorProfile>(
        [CREATOR_PROFILE_QUERY_KEY, creatorId, useMock ? 'mock' : 'remote'],
        (current) =>
          current
            ? {
                ...current,
                isBlocking,
                isFollowing: isBlocking ? false : current.isFollowing,
                designs: isBlocking ? [] : current.designs,
                publicCollections: isBlocking ? [] : current.publicCollections,
              }
            : current,
      );
      await invalidate();
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (params: { reason: ReportReason; notes?: string | null }) => {
      if (useMock) {
        return { mock: true as const };
      }
      return reportCreator({
        creatorId,
        reason: params.reason,
        notes: params.notes,
      });
    },
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    followMutation,
    blockMutation,
    reportMutation,
    useMock,
  };
}
