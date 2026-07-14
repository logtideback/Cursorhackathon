-- Align taxonomy with Taste product categories and seed tag catalogue.
-- Safe to re-run: upserts by slug.

insert into public.categories (name, slug, description) values
  ('Mobile apps', 'mobile-apps', 'Native and cross-platform handheld product UI.'),
  ('Web apps', 'web-apps', 'SaaS and product web application interfaces.'),
  ('E-commerce', 'ecommerce', 'Storefronts, product detail, and checkout craft.'),
  ('Editorial', 'editorial', 'Publishing, magazine, and long-form layout.'),
  ('Branding', 'branding', 'Identity systems, marks, and brand applications.'),
  ('Portfolios', 'portfolios', 'Portfolio sites and case-study framing.'),
  ('Dashboards', 'dashboards', 'Analytics, admin, and operations surfaces.'),
  ('Fintech', 'fintech', 'Money, trust, and financial product design.'),
  ('Health', 'health', 'Care, wellness, and clinical product UI.'),
  ('Travel', 'travel', 'Journey planning, booking, and place discovery.'),
  ('Social', 'social', 'Feeds, profiles, and community product design.'),
  ('Experimental', 'experimental', 'Boundary work, prototypes, and speculative UI.')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description;

insert into public.tags (name, slug) values
  ('Brutalist', 'brutalist'),
  ('Minimal', 'minimal'),
  ('Editorial', 'editorial'),
  ('Swiss', 'swiss'),
  ('Retro', 'retro'),
  ('Monochrome', 'monochrome'),
  ('Typographic', 'typographic'),
  ('Playful', 'playful'),
  ('Maximalist', 'maximalist'),
  ('Dark', 'dark'),
  ('Organic', 'organic'),
  ('Geometric', 'geometric'),
  ('Neumorphic', 'neumorphic'),
  ('Y2K', 'y2k'),
  ('Accessible', 'accessible'),
  ('Motion-led', 'motion-led'),
  ('High-contrast', 'high-contrast'),
  ('Soft', 'soft'),
  ('Industrial', 'industrial'),
  ('Luxury', 'luxury'),
  ('Hand-drawn', 'hand-drawn'),
  ('Data-dense', 'data-dense'),
  ('Spacious', 'spacious'),
  ('Grid-based', 'grid-based'),
  ('Illustration-led', 'illustration-led'),
  ('Photography-led', 'photography-led'),
  ('Serif', 'serif'),
  ('Sans-serif', 'sans-serif'),
  ('Experimental navigation', 'experimental-navigation'),
  ('Bold colour', 'bold-colour'),
  ('Muted colour', 'muted-colour'),
  ('Responsive', 'responsive'),
  ('Mobile-first', 'mobile-first'),
  ('Conversion-focused', 'conversion-focused'),
  ('Content-first', 'content-first'),
  ('Functional', 'functional'),
  ('Futuristic', 'futuristic'),
  ('Nostalgic', 'nostalgic'),
  ('Modular', 'modular'),
  ('Minimal navigation', 'minimal-navigation'),
  ('Empty state', 'empty-state'),
  ('Onboarding', 'onboarding'),
  ('Paywall', 'paywall'),
  ('Typography focus', 'typography-focus'),
  ('Card UI', 'card-ui')
on conflict (slug) do update
set name = excluded.name;
