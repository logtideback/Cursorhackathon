export const CATEGORY_DEFS = [
  {
    slug: 'mobile-apps',
    name: 'Mobile apps',
    description: 'Native and cross-platform handheld product UI.',
  },
  {
    slug: 'web-apps',
    name: 'Web apps',
    description: 'SaaS and product web application interfaces.',
  },
  {
    slug: 'ecommerce',
    name: 'E-commerce',
    description: 'Storefronts, product detail, and checkout craft.',
  },
  {
    slug: 'editorial',
    name: 'Editorial',
    description: 'Publishing, magazine, and long-form layout.',
  },
  {
    slug: 'branding',
    name: 'Branding',
    description: 'Identity systems, marks, and brand applications.',
  },
  {
    slug: 'portfolios',
    name: 'Portfolios',
    description: 'Portfolio sites and case-study framing.',
  },
  {
    slug: 'dashboards',
    name: 'Dashboards',
    description: 'Analytics, admin, and operations surfaces.',
  },
  {
    slug: 'fintech',
    name: 'Fintech',
    description: 'Money, trust, and financial product design.',
  },
  {
    slug: 'health',
    name: 'Health',
    description: 'Care, wellness, and clinical product UI.',
  },
  {
    slug: 'travel',
    name: 'Travel',
    description: 'Journey planning, booking, and place discovery.',
  },
  {
    slug: 'social',
    name: 'Social',
    description: 'Feeds, profiles, and community product design.',
  },
  {
    slug: 'experimental',
    name: 'Experimental',
    description: 'Boundary work, prototypes, and speculative UI.',
  },
] as const;

export const TAG_DEFS = [
  { slug: 'brutalist', name: 'Brutalist' },
  { slug: 'minimal', name: 'Minimal' },
  { slug: 'editorial', name: 'Editorial' },
  { slug: 'swiss', name: 'Swiss' },
  { slug: 'retro', name: 'Retro' },
  { slug: 'monochrome', name: 'Monochrome' },
  { slug: 'typographic', name: 'Typographic' },
  { slug: 'playful', name: 'Playful' },
  { slug: 'maximalist', name: 'Maximalist' },
  { slug: 'dark', name: 'Dark' },
  { slug: 'organic', name: 'Organic' },
  { slug: 'geometric', name: 'Geometric' },
  { slug: 'neumorphic', name: 'Neumorphic' },
  { slug: 'y2k', name: 'Y2K' },
  { slug: 'accessible', name: 'Accessible' },
  { slug: 'motion-led', name: 'Motion-led' },
  { slug: 'high-contrast', name: 'High-contrast' },
  { slug: 'soft', name: 'Soft' },
  { slug: 'industrial', name: 'Industrial' },
  { slug: 'luxury', name: 'Luxury' },
  { slug: 'hand-drawn', name: 'Hand-drawn' },
  { slug: 'data-dense', name: 'Data-dense' },
  { slug: 'spacious', name: 'Spacious' },
  { slug: 'grid-based', name: 'Grid-based' },
  { slug: 'illustration-led', name: 'Illustration-led' },
  { slug: 'photography-led', name: 'Photography-led' },
  { slug: 'serif', name: 'Serif' },
  { slug: 'sans-serif', name: 'Sans-serif' },
  { slug: 'experimental-navigation', name: 'Experimental navigation' },
  { slug: 'bold-colour', name: 'Bold colour' },
  { slug: 'muted-colour', name: 'Muted colour' },
  { slug: 'responsive', name: 'Responsive' },
  { slug: 'mobile-first', name: 'Mobile-first' },
  { slug: 'conversion-focused', name: 'Conversion-focused' },
  { slug: 'content-first', name: 'Content-first' },
  { slug: 'functional', name: 'Functional' },
  { slug: 'futuristic', name: 'Futuristic' },
  { slug: 'nostalgic', name: 'Nostalgic' },
  { slug: 'modular', name: 'Modular' },
  { slug: 'minimal-navigation', name: 'Minimal navigation' },
  { slug: 'empty-state', name: 'Empty state' },
  { slug: 'onboarding', name: 'Onboarding' },
  { slug: 'paywall', name: 'Paywall' },
  { slug: 'typography-focus', name: 'Typography focus' },
  { slug: 'card-ui', name: 'Card UI' },
] as const;

export const PLATFORMS = [
  'ios',
  'android',
  'responsive-web',
  'desktop-web',
  'tablet',
  'watch',
  'brand-identity',
  'print',
] as const;

export const INDUSTRIES = [
  'saas',
  'fintech',
  'health',
  'lifestyle',
  'ecommerce',
  'media',
  'education',
  'travel',
] as const;

export const COLOUR_FAMILIES = [
  'warm-neutrals',
  'cool-greys',
  'ink-black',
  'forest',
  'ochre',
  'terracotta',
  'slate-blue',
  'soft-pink',
] as const;

export const PROVENANCES = [
  'original_work',
  'client_work',
  'concept',
  'redesign',
  'ai_assisted',
  'fully_ai_generated',
] as const;

export type Provenance = (typeof PROVENANCES)[number];
