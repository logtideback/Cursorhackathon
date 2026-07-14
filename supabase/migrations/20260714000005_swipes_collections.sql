-- Swipes, collections, collection items, and auth bootstrap.

create type public.swipe_direction as enum ('left', 'right');

create type public.saved_aspect as enum (
  'typography',
  'layout',
  'navigation',
  'motion',
  'colour',
  'branding',
  'interaction',
  'other'
);

create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  design_id uuid not null references public.designs (id) on delete cascade,
  direction public.swipe_direction not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint swipes_user_design_unique unique (user_id, design_id)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  cover_image_url text,
  is_private boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint collections_name_not_blank check (length(trim(name)) > 0)
);

-- One default collection per user.
create unique index collections_one_default_per_user_idx
  on public.collections (user_id)
  where is_default = true;

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  design_id uuid not null references public.designs (id) on delete cascade,
  note text,
  saved_aspect public.saved_aspect,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint collection_items_unique_design unique (collection_id, design_id),
  constraint collection_items_sort_order_nonnegative check (sort_order >= 0),
  constraint collection_items_note_length check (note is null or char_length(note) <= 1000)
);

create index swipes_user_id_created_at_idx on public.swipes (user_id, created_at desc);
create index swipes_design_id_idx on public.swipes (design_id);
create index collections_user_id_idx on public.collections (user_id);
create index collection_items_collection_id_sort_idx
  on public.collection_items (collection_id, sort_order);
create index collection_items_design_id_idx on public.collection_items (design_id);

create trigger collections_set_updated_at
before update on public.collections
for each row
execute function public.set_updated_at();

-- Profile + preferences + default Saved collection after auth signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_display_name text;
begin
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(split_part(coalesce(new.email, ''), '@', 1)), ''),
    'Taste member'
  );

  v_username := lower(regexp_replace(coalesce(v_display_name, 'user'), '[^a-z0-9_]', '', 'g'));
  if char_length(v_username) < 3 then
    v_username := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  v_username := left(v_username, 24) || substr(replace(new.id::text, '-', ''), 1, 6);

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    v_username,
    v_display_name,
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );

  insert into public.user_preferences (user_id)
  values (new.id);

  insert into public.collections (
    user_id,
    name,
    description,
    is_private,
    is_default
  )
  values (
    new.id,
    'Saved',
    'Designs you swipe right on.',
    true,
    true
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
