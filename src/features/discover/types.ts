import type { SwipeDirection } from '@/types/database';

export type DiscoverCard = {
  id: string;
  title: string;
  description: string | null;
  creatorId: string;
  creatorName: string;
  creatorUsername: string | null;
  category: string | null;
  platform: string | null;
  tags: string[];
  saveCount: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  source: 'remote' | 'mock';
};

export type SwipeHistoryEntry = {
  card: DiscoverCard;
  direction: SwipeDirection;
  recordedRemotely: boolean;
  swipeId?: string;
};

export type UndoToastState = {
  visible: boolean;
  direction: SwipeDirection | null;
  designId: string | null;
  title: string | null;
  message: string;
};

export type DeckStatus = 'loading' | 'ready' | 'empty' | 'error';
