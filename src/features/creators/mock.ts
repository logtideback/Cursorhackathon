import type { CreatorProfile } from '@/features/creators/types';
import { getMockDiscoverCards } from '@/features/discover/data/mock-designs';

export function getMockCreatorProfile(creatorId: string, viewerId?: string): CreatorProfile {
  const cards = getMockDiscoverCards(20).filter((card) => card.creatorId === creatorId);
  const fallback = getMockDiscoverCards(8);
  const designs = (cards.length > 0 ? cards : fallback.slice(0, 4)).map((card) => ({
    id: card.id,
    title: card.title,
    provenance: 'original_work' as const,
    saveCount: card.saveCount,
    createdAt: new Date().toISOString(),
    imageUrl: card.imageUrl,
    thumbnailUrl: card.thumbnailUrl,
  }));

  const name = cards[0]?.creatorName ?? 'Taste creator';
  const username = cards[0]?.creatorUsername ?? 'creator';

  return {
    id: creatorId,
    username,
    displayName: name,
    avatarUrl: null,
    bio: 'Editorial systems, calm product UI, and thoughtful type.',
    websiteUrl: 'https://example.com',
    accountStatus: creatorId.includes('suspended') ? 'suspended' : 'active',
    isSelf: Boolean(viewerId && viewerId === creatorId),
    isFollowing: false,
    isBlocking: creatorId.includes('blocked'),
    isBlockedByThem: false,
    followerCount: 184,
    followingCount: 42,
    publishedDesignCount: designs.length,
    designs,
    publicCollections: [
      {
        id: 'mock-col-type',
        name: 'Typography studies',
        description: 'Quiet type specimens.',
        cover_image_url: designs[0]?.imageUrl ?? null,
        updated_at: new Date().toISOString(),
      },
    ],
    source: 'mock',
  };
}
