-- Designs, images, and design↔tag relationships.

create type public.design_provenance as enum (
  'original_work',
  'client_work',
  'concept',
  'redesign',
  'ai_assisted',
  'fully_ai_generated'
);

create type public.design_status as enum (
  'draft',
  'published',
  'archived',
  'removed'
);

create table public.designs (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  category_id uuid references public.categories (id) on delete set null,
  source_url text,
  platform text,
  industry text,
  provenance public.design_provenance not null default 'original_work',
  status public.design_status not null default 'draft',
  is_featured boolean not null default false,
  save_count integer not null default 0,
  view_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint designs_title_not_blank check (length(trim(title)) > 0),
  constraint designs_save_count_nonnegative check (save_count >= 0),
  constraint designs_view_count_nonnegative check (view_count >= 0),
  constraint designs_source_url_format check (
    source_url is null
    or source_url ~* '^https?://'
  )
);

create table public.design_images (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs (id) on delete cascade,
  image_url text not null,
  thumbnail_url text,
  width integer,
  height integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint design_images_image_url_not_blank check (length(trim(image_url)) > 0),
  constraint design_images_width_positive check (width is null or width > 0),
  constraint design_images_height_positive check (height is null or height > 0),
  constraint design_images_sort_order_nonnegative check (sort_order >= 0)
);

create table public.design_tags (
  design_id uuid not null references public.designs (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (design_id, tag_id)
);

create index designs_creator_id_idx on public.designs (creator_id);
create index designs_category_id_idx on public.designs (category_id);
create index designs_status_created_at_idx on public.designs (status, created_at desc);
create index designs_featured_idx on public.designs (is_featured) where is_featured = true;
create index design_images_design_id_sort_idx on public.design_images (design_id, sort_order);
create index design_tags_tag_id_idx on public.design_tags (tag_id);

create trigger designs_set_updated_at
before update on public.designs
for each row
execute function public.set_updated_at();
