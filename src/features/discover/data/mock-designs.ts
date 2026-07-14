import type { UnseenDesignRow } from '@/types/database';

import { mapUnseenDesign } from '@/features/discover/map-design';
import type { DiscoverCard } from '@/features/discover/types';

const MOCK_ROWS: UnseenDesignRow[] = [
  {
    id: 'mock-01',
    creator_id: 'creator-aria',
    title: 'Atlas banking overview',
    description: 'Dense but calm portfolio chart with restrained type.',
    category_id: null,
    source_url: null,
    platform: 'iOS',
    industry: 'Fintech',
    provenance: 'original_work',
    status: 'published',
    is_featured: true,
    save_count: 184,
    view_count: 2401,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_username: 'aria.form',
    creator_display_name: 'Aria Form',
    creator_avatar_url: null,
    primary_image_url:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    primary_thumbnail_url:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=60',
    tags: ['Dashboard', 'Minimal', 'Fintech'],
  },
  {
    id: 'mock-02',
    creator_id: 'creator-june',
    title: 'Northline magazine cover',
    description: 'Editorial grid with oversized serif and negative space.',
    category_id: null,
    source_url: null,
    platform: 'Print',
    industry: 'Media',
    provenance: 'original_work',
    status: 'published',
    is_featured: false,
    save_count: 96,
    view_count: 1102,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_username: 'june.atelier',
    creator_display_name: 'June Atelier',
    creator_avatar_url: null,
    primary_image_url:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    primary_thumbnail_url:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=60',
    tags: ['Editorial', 'Typography', 'Swiss'],
  },
  {
    id: 'mock-03',
    creator_id: 'creator-milo',
    title: 'Harbor onboarding sequence',
    description: 'Three-step mobile onboarding with quiet illustration blocks.',
    category_id: null,
    source_url: null,
    platform: 'Android',
    industry: 'Lifestyle',
    provenance: 'concept',
    status: 'published',
    is_featured: true,
    save_count: 241,
    view_count: 3904,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_username: 'milo.north',
    creator_display_name: 'Milo North',
    creator_avatar_url: null,
    primary_image_url:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
    primary_thumbnail_url:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=400&q=60',
    tags: ['Onboarding', 'Mobile', 'Soft UI'],
  },
  {
    id: 'mock-04',
    creator_id: 'creator-lena',
    title: 'Keystone brand board',
    description: 'Identity system with ink black and ochre accents.',
    category_id: null,
    source_url: null,
    platform: 'Brand identity',
    industry: 'SaaS',
    provenance: 'client_work',
    status: 'published',
    is_featured: false,
    save_count: 67,
    view_count: 890,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_username: 'lena.feld',
    creator_display_name: 'Lena Feld',
    creator_avatar_url: null,
    primary_image_url:
      'https://images.unsplash.com/photo-1634942537034-2531766767d1?auto=format&fit=crop&w=1200&q=80',
    primary_thumbnail_url:
      'https://images.unsplash.com/photo-1634942537034-2531766767d1?auto=format&fit=crop&w=400&q=60',
    tags: ['Branding', 'Monochrome', 'Geometric'],
  },
  {
    id: 'mock-05',
    creator_id: 'creator-orin',
    title: 'Pulse commerce PDP',
    description: 'Product detail layout with photography-led hierarchy.',
    category_id: null,
    source_url: null,
    platform: 'Responsive web',
    industry: 'E-commerce',
    provenance: 'redesign',
    status: 'published',
    is_featured: true,
    save_count: 312,
    view_count: 5120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_username: 'orin.kline',
    creator_display_name: 'Orin Kline',
    creator_avatar_url: null,
    primary_image_url:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    primary_thumbnail_url:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=60',
    tags: ['E-commerce', 'Photography', 'Web'],
  },
  {
    id: 'mock-06',
    creator_id: 'creator-nova',
    title: 'Signal watch complications',
    description: 'Compact watch UI with crisp data craft.',
    category_id: null,
    source_url: null,
    platform: 'Watch',
    industry: 'Health',
    provenance: 'concept',
    status: 'published',
    is_featured: false,
    save_count: 54,
    view_count: 760,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_username: 'nova.reed',
    creator_display_name: 'Nova Reed',
    creator_avatar_url: null,
    primary_image_url:
      'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=1200&q=80',
    primary_thumbnail_url:
      'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=400&q=60',
    tags: ['Watch', 'Data', 'Minimal'],
  },
  {
    id: 'mock-07',
    creator_id: 'creator-sol',
    title: 'Cascade landing nocturne',
    description: 'Marketing site with controlled dark composition.',
    category_id: null,
    source_url: null,
    platform: 'Desktop web',
    industry: 'SaaS',
    provenance: 'original_work',
    status: 'published',
    is_featured: true,
    save_count: 198,
    view_count: 2877,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_username: 'sol.west',
    creator_display_name: 'Sol West',
    creator_avatar_url: null,
    primary_image_url:
      'https://images.unsplash.com/photo-1558591710-4b4a1ae728f0?auto=format&fit=crop&w=1200&q=80',
    primary_thumbnail_url:
      'https://images.unsplash.com/photo-1558591710-4b4a1ae728f0?auto=format&fit=crop&w=400&q=60',
    tags: ['Marketing', 'Dark Mode', 'Layout'],
  },
  {
    id: 'mock-08',
    creator_id: 'creator-ivy',
    title: 'Field notes type specimen',
    description: 'Typographic poster with modular rhythm.',
    category_id: null,
    source_url: null,
    platform: 'Print',
    industry: 'Lifestyle',
    provenance: 'original_work',
    status: 'published',
    is_featured: false,
    save_count: 143,
    view_count: 1660,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_username: 'ivy.grove',
    creator_display_name: 'Ivy Grove',
    creator_avatar_url: null,
    primary_image_url:
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=1200&q=80',
    primary_thumbnail_url:
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=400&q=60',
    tags: ['Typography', 'Poster', 'Experimental'],
  },
];

const CATEGORY_BY_ID: Record<string, string> = {
  'mock-01': 'Dashboard',
  'mock-02': 'Editorial',
  'mock-03': 'Mobile app',
  'mock-04': 'Brand identity',
  'mock-05': 'E-commerce',
  'mock-06': 'Wearable',
  'mock-07': 'Marketing site',
  'mock-08': 'Typography',
};

export function getMockDiscoverCards(limit = 12): DiscoverCard[] {
  return MOCK_ROWS.slice(0, limit).map((row) => {
    const card = mapUnseenDesign(row, 'mock');
    return { ...card, category: CATEGORY_BY_ID[row.id] ?? null };
  });
}

export function isMockDesignId(id: string): boolean {
  return id.startsWith('mock-');
}
