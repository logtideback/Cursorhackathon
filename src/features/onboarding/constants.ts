export type PreferenceOption = {
  id: string;
  label: string;
  subtitle?: string;
};

export const DESIGN_STYLES: PreferenceOption[] = [
  { id: 'minimal', label: 'Minimal', subtitle: 'Quiet space' },
  { id: 'editorial', label: 'Editorial', subtitle: 'Type-led' },
  { id: 'brutalist', label: 'Brutalist', subtitle: 'Raw form' },
  { id: 'swiss', label: 'Swiss', subtitle: 'Grid rigor' },
  { id: 'retro', label: 'Retro', subtitle: 'Period craft' },
  { id: 'monochrome', label: 'Monochrome', subtitle: 'Tone only' },
  { id: 'typographic', label: 'Typographic', subtitle: 'Letterform' },
  { id: 'playful', label: 'Playful', subtitle: 'Light touch' },
  { id: 'maximalist', label: 'Maximalist', subtitle: 'Dense detail' },
  { id: 'experimental', label: 'Experimental', subtitle: 'Boundary work' },
  { id: 'organic', label: 'Organic', subtitle: 'Soft geometry' },
  { id: 'geometric', label: 'Geometric', subtitle: 'Hard shape' },
];

export const INDUSTRIES: PreferenceOption[] = [
  { id: 'saas', label: 'SaaS', subtitle: 'Product software' },
  { id: 'fintech', label: 'Fintech', subtitle: 'Money & trust' },
  { id: 'health', label: 'Health', subtitle: 'Care & wellness' },
  { id: 'lifestyle', label: 'Lifestyle', subtitle: 'Culture & leisure' },
  { id: 'ecommerce', label: 'Commerce', subtitle: 'Retail & shop' },
  { id: 'media', label: 'Media', subtitle: 'Publish & news' },
  { id: 'education', label: 'Education', subtitle: 'Learn & teach' },
  { id: 'travel', label: 'Travel', subtitle: 'Place & journey' },
];

export const PLATFORMS: PreferenceOption[] = [
  { id: 'ios', label: 'iOS' },
  { id: 'android', label: 'Android' },
  { id: 'responsive-web', label: 'Responsive web' },
  { id: 'desktop-web', label: 'Desktop web' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'watch', label: 'Watch' },
  { id: 'brand-identity', label: 'Brand identity' },
  { id: 'print', label: 'Print' },
];

export const COLOUR_FAMILIES: (PreferenceOption & { swatch: string })[] = [
  { id: 'warm-neutrals', label: 'Warm neutrals', swatch: '#E8DFD4' },
  { id: 'cool-greys', label: 'Cool greys', swatch: '#D5D8DC' },
  { id: 'ink-black', label: 'Ink black', swatch: '#1A1A1A' },
  { id: 'forest', label: 'Forest', swatch: '#3E5C4A' },
  { id: 'ochre', label: 'Ochre', swatch: '#C2923C' },
  { id: 'terracotta', label: 'Clay', swatch: '#A66A55' },
  { id: 'slate-blue', label: 'Slate blue', swatch: '#4A5C6A' },
  { id: 'soft-pink', label: 'Dusty rose', swatch: '#D8B4B0' },
];

export const CATEGORIES: PreferenceOption[] = [
  { id: 'mobile-apps', label: 'Mobile apps', subtitle: 'Handheld products' },
  { id: 'web-apps', label: 'Web apps', subtitle: 'Product surfaces' },
  { id: 'ecommerce', label: 'E-commerce', subtitle: 'Buying flows' },
  { id: 'editorial', label: 'Editorial', subtitle: 'Stories & type' },
  { id: 'branding', label: 'Branding', subtitle: 'Systems & marks' },
  { id: 'portfolios', label: 'Portfolios', subtitle: 'Case studies' },
  { id: 'dashboards', label: 'Dashboards', subtitle: 'Data & ops' },
  { id: 'fintech', label: 'Fintech', subtitle: 'Money & trust' },
  { id: 'health', label: 'Health', subtitle: 'Care & wellness' },
  { id: 'travel', label: 'Travel', subtitle: 'Place & journey' },
  { id: 'social', label: 'Social', subtitle: 'Feeds & community' },
  { id: 'experimental', label: 'Experimental', subtitle: 'Boundary work' },
];

export const ONBOARDING_CAROUSEL = [
  {
    key: 'discover',
    label: '01',
    title: 'Discover without\nthe endless scroll',
    body: 'Taste shows one considered design at a time. Swipe with purpose instead of drowning in feeds.',
  },
  {
    key: 'train',
    label: '02',
    title: 'Train your eye\nby swiping',
    body: 'Right when a composition moves you. Left when it does not. Over time, Taste learns your visual palate.',
  },
  {
    key: 'save',
    label: '03',
    title: 'Save what is worth\nreturning to',
    body: 'Build curated collections of layout, type, and colour — a personal archive beyond generic trends.',
  },
] as const;
