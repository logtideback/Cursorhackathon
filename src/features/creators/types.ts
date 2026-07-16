import type { DesignProvenance } from '@/types/database';

export type CreatorDesignCard = {
  id: string;
  title: string;
  provenance: DesignProvenance;
  saveCount: number;
  createdAt: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
};

export type CreatorPublicCollection = {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  updated_at: string;
};

export type CreatorProfile = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  websiteUrl: string | null;
  accountStatus: 'active' | 'suspended';
  isSelf: boolean;
  isFollowing: boolean;
  isBlocking: boolean;
  isBlockedByThem: boolean;
  followerCount: number;
  followingCount: number;
  publishedDesignCount: number;
  designs: CreatorDesignCard[];
  publicCollections: CreatorPublicCollection[];
  source: 'remote' | 'mock';
};
