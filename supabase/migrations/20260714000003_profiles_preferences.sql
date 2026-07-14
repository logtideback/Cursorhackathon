-- Profiles and preferences.

create type public.user_role as enum ('user', 'creator', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  website_url text,
  role public.user_role not null default 'user',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_username_format check (
    username is null
    or username ~ '^[a-z0-9_]{3,30}$'
  ),
  constraint profiles_username_unique unique (username),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 500),
  constraint profiles_website_url_format check (
    website_url is null
    or website_url ~* '^https?://'
  )
);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  preferred_categories text[] not null default '{}',
  preferred_styles text[] not null default '{}',
  preferred_platforms text[] not null default '{}',
  preferred_industries text[] not null default '{}',
  preferred_colour_families text[] not null default '{}',
  disliked_categories text[] not null default '{}',
  disliked_styles text[] not null default '{}',
  disliked_tags text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_preferences_user_unique unique (user_id)
);

create index profiles_username_idx on public.profiles (username);
create index profiles_role_idx on public.profiles (role);
create index user_preferences_user_id_idx on public.user_preferences (user_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row
execute function public.set_updated_at();
