-- Lookup tables: categories and tags.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  constraint categories_name_not_blank check (length(trim(name)) > 0),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint categories_slug_unique unique (slug),
  constraint categories_name_unique unique (name)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  constraint tags_name_not_blank check (length(trim(name)) > 0),
  constraint tags_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint tags_slug_unique unique (slug),
  constraint tags_name_unique unique (name)
);

create index categories_name_idx on public.categories (name);
create index tags_name_idx on public.tags (name);
