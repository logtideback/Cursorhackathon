import { followCreator, reportDesign, unfollowCreator } from '@/services/social';

export const creatorsApi = {
  followCreator,
  unfollowCreator,
};

export const moderationApi = {
  reportDesign,
};

export type CreatorsFeature = 'creators';
