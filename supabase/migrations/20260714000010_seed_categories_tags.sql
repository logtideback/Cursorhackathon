-- Seed categories and tags for Taste discovery.

insert into public.categories (name, slug, description) values
  ('Mobile App', 'mobile-app', 'Native and cross-platform mobile interfaces.'),
  ('Web App', 'web-app', 'Product and SaaS web application UI.'),
  ('Marketing Site', 'marketing-site', 'Landing pages and brand marketing sites.'),
  ('Dashboard', 'dashboard', 'Analytics, admin, and operations dashboards.'),
  ('E-commerce', 'ecommerce', 'Storefronts, PDP, checkout, and retail UX.'),
  ('Editorial', 'editorial', 'Magazine, publishing, and content layouts.'),
  ('Brand Identity', 'brand-identity', 'Logo systems, identity kits, and brand boards.'),
  ('Typography', 'typography', 'Type-led compositions and specimen work.'),
  ('Illustration', 'illustration', 'Graphic illustration and visual systems.'),
  ('Motion', 'motion', 'Motion studies, microinteractions, and animation.')
on conflict (slug) do nothing;

insert into public.tags (name, slug) values
  ('Minimal', 'minimal'),
  ('Brutalist', 'brutalist'),
  ('Soft UI', 'soft-ui'),
  ('Glass', 'glass'),
  ('Dark Mode', 'dark-mode'),
  ('Light Mode', 'light-mode'),
  ('High Contrast', 'high-contrast'),
  ('Editorial Layout', 'editorial-layout'),
  ('Grid System', 'grid-system'),
  ('Swiss', 'swiss'),
  ('Playful', 'playful'),
  ('Corporate', 'corporate'),
  ('Fintech', 'fintech'),
  ('Health', 'health'),
  ('Lifestyle', 'lifestyle'),
  ('SaaS', 'saas'),
  ('Consumer', 'consumer'),
  ('Navigation', 'navigation'),
  ('Onboarding', 'onboarding'),
  ('Empty State', 'empty-state'),
  ('Paywall', 'paywall'),
  ('Card UI', 'card-ui'),
  ('Typography Focus', 'typography-focus'),
  ('Colour System', 'colour-system'),
  ('Iconography', 'iconography'),
  ('Microinteraction', 'microinteraction'),
  ('3D', '3d'),
  ('Photography Led', 'photography-led'),
  ('Hand Drawn', 'hand-drawn'),
  ('AI Generated', 'ai-generated')
on conflict (slug) do nothing;
