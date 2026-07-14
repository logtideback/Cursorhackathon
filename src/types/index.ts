export type DesignId = string;
export type CreatorId = string;
export type CollectionId = string;

export type SwipeDirection = 'left' | 'right';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type DesignCard = {
  id: DesignId;
  title: string;
  imageUrl: string;
  creatorId: CreatorId;
  creatorName: string;
  tags: string[];
};

export type { Database, Json } from './database';
