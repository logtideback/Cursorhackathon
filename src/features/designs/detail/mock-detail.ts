import type { DesignProvenance } from '@/types/database';

import type { DesignDetail, SimilarDesignCard } from '@/features/designs/detail/types';
import { getMockDiscoverCards } from '@/features/discover/data/mock-designs';

type MockSeed = {
  id: string;
  provenance: DesignProvenance;
  sourceUrl: string | null;
  industry: string;
  images: string[];
  description: string;
  publishedCount: number;
};

const EXTRA_IMAGES: Record<string, string[]> = {
  'mock-01': [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1400&q=80',
  ],
  'mock-02': [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=1400&q=80',
  ],
  'mock-03': [
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=1400&q=80',
  ],
  'mock-04': [
    'https://images.unsplash.com/photo-1634942537034-2531766767d1?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1400&q=80',
  ],
  'mock-05': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80',
  ],
  'mock-06': [
    'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=1400&q=80',
  ],
  'mock-07': [
    'https://images.unsplash.com/photo-1558591710-4b4a1ae728f0?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1400&q=80',
  ],
  'mock-08': [
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=1400&q=80',
  ],
};

const SEEDS: Record<string, MockSeed> = {
  'mock-01': {
    id: 'mock-01',
    provenance: 'original_work',
    sourceUrl: 'https://example.com/atlas-banking',
    industry: 'Fintech',
    images: EXTRA_IMAGES['mock-01'] ?? [],
    description:
      'A calm portfolio overview that balances dense market data with restrained typography and generous breathing room.',
    publishedCount: 24,
  },
  'mock-02': {
    id: 'mock-02',
    provenance: 'original_work',
    sourceUrl: 'https://example.com/northline',
    industry: 'Media',
    images: EXTRA_IMAGES['mock-02'] ?? [],
    description:
      'Editorial grid with oversized serif and negative space for a print-first magazine cover.',
    publishedCount: 11,
  },
  'mock-03': {
    id: 'mock-03',
    provenance: 'concept',
    sourceUrl: null,
    industry: 'Lifestyle',
    images: EXTRA_IMAGES['mock-03'] ?? [],
    description:
      'Three-step mobile onboarding with quiet illustration blocks and soft motion cues.',
    publishedCount: 18,
  },
  'mock-04': {
    id: 'mock-04',
    provenance: 'client_work',
    sourceUrl: 'https://example.com/keystone',
    industry: 'SaaS',
    images: EXTRA_IMAGES['mock-04'] ?? [],
    description:
      'Identity system with ink black and ochre accents across collateral and product UI.',
    publishedCount: 31,
  },
  'mock-05': {
    id: 'mock-05',
    provenance: 'redesign',
    sourceUrl: 'https://example.com/pulse-pdp',
    industry: 'E-commerce',
    images: EXTRA_IMAGES['mock-05'] ?? [],
    description:
      'Product detail layout with photography-led hierarchy and restrained commerce chrome.',
    publishedCount: 14,
  },
  'mock-06': {
    id: 'mock-06',
    provenance: 'concept',
    sourceUrl: 'not-a-valid-url',
    industry: 'Health',
    images: EXTRA_IMAGES['mock-06'] ?? [],
    description:
      'Compact watch UI with crisp data craft across complications and glanceable status.',
    publishedCount: 9,
  },
  'mock-07': {
    id: 'mock-07',
    provenance: 'ai_assisted',
    sourceUrl: 'https://example.com/cascade',
    industry: 'SaaS',
    images: EXTRA_IMAGES['mock-07'] ?? [],
    description: 'Marketing site with a controlled nocturnal composition and typed hierarchy.',
    publishedCount: 22,
  },
  'mock-08': {
    id: 'mock-08',
    provenance: 'fully_ai_generated',
    sourceUrl: 'ftp://unsupported.example/specimen',
    industry: 'Lifestyle',
    images: EXTRA_IMAGES['mock-08'] ?? [],
    description: 'Typographic poster with modular rhythm — useful as a type specimen study.',
    publishedCount: 7,
  },
};

export function getMockDesignDetail(id: string): DesignDetail | null {
  const cards = getMockDiscoverCards(20);
  const card = cards.find((item) => item.id === id);
  const seed = SEEDS[id];
  if (!card || !seed) {
    return null;
  }

  const imageUrls = seed.images.length > 0 ? seed.images : card.imageUrl ? [card.imageUrl] : [];

  return {
    id: card.id,
    title: card.title,
    description: seed.description,
    category: card.category,
    platform: card.platform,
    industry: seed.industry,
    tags: card.tags,
    provenance: seed.provenance,
    status: 'published',
    sourceUrl: seed.sourceUrl,
    saveCount: card.saveCount,
    viewCount: card.saveCount * 12,
    images: imageUrls.map((url, index) => ({
      id: `${card.id}-img-${index}`,
      imageUrl: url,
      thumbnailUrl: url,
      width: 1200,
      height: 1500,
      sortOrder: index,
    })),
    creator: {
      id: card.creatorId,
      displayName: card.creatorName,
      username: card.creatorUsername,
      avatarUrl: null,
      publishedDesignCount: seed.publishedCount,
      accountStatus: 'active',
      isFollowing: false,
      isSelf: false,
    },
    source: 'mock',
  };
}

export function getMockSimilarDesigns(designId: string, limit = 12): SimilarDesignCard[] {
  return getMockDiscoverCards(20)
    .filter((card) => card.id !== designId && Boolean(card.imageUrl))
    .slice(0, limit)
    .map((card) => ({
      id: card.id,
      title: card.title,
      imageUrl: card.imageUrl,
      thumbnailUrl: card.thumbnailUrl,
      creatorName: card.creatorName,
    }));
}
