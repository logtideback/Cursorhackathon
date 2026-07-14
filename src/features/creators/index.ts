import { reportCreator } from '@/services/creators';
import { blockCreator, followCreator, unblockCreator, unfollowCreator } from '@/services/social';

export { CREATOR_PROFILE_QUERY_KEY, PROVENANCE_EXPLANATIONS } from '@/features/creators/constants';
export { useCreatorProfile } from '@/features/creators/hooks/useCreatorProfile';
export { getMockCreatorProfile } from '@/features/creators/mock';
export { CreatorProfileScreen } from '@/features/creators/screens/CreatorProfileScreen';
export type {
  CreatorDesignCard,
  CreatorProfile,
  CreatorPublicCollection,
} from '@/features/creators/types';

export const creatorsApi = {
  followCreator,
  unfollowCreator,
  blockCreator,
  unblockCreator,
  reportCreator,
};
