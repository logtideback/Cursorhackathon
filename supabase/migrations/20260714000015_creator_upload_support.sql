-- Creator profiles, design reports on creators, moderation flags.

-- Allow reporting either a design or a creator.
alter table public.reports
  alter column design_id drop not null;

alter table public.reports
  add column if not exists reported_creator_id uuid references public.profiles (id) on delete cascade;

alter table public.reports
  drop constraint if exists reports_target_check;

alter table public.reports
  add constraint reports_target_check check (
    (design_id is not null and reported_creator_id is null)
    or (design_id is null and reported_creator_id is not null)
  );

create index if not exists reports_reported_creator_id_idx
  on public.reports (reported_creator_id);

-- Moderation review queue — flags for human review, not automatic accusations.
create type public.moderation_flag_kind as enum (
  'image_safety',
  'duplicate_image',
  'design_similarity'
);

create type public.moderation_flag_status as enum (
  'open',
  'reviewing',
  'cleared',
  'actioned'
);

create table if not exists public.design_moderation_flags (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs (id) on delete cascade,
  kind public.moderation_flag_kind not null,
  status public.moderation_flag_status not null default 'open',
  score numeric,
  related_design_ids uuid[] not null default '{}'::uuid[],
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists design_moderation_flags_design_id_idx
  on public.design_moderation_flags (design_id);
create index if not exists design_moderation_flags_status_idx
  on public.design_moderation_flags (status, created_at desc);

alter table public.design_moderation_flags enable row level security;

create policy "Creators read own design moderation flags"
  on public.design_moderation_flags for select
  to authenticated
  using (
    exists (
      select 1 from public.designs d
      where d.id = design_id and d.creator_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "System insert moderation flags via owner"
  on public.design_moderation_flags for insert
  to authenticated
  with check (
    exists (
      select 1 from public.designs d
      where d.id = design_id and d.creator_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "Admins update moderation flags"
  on public.design_moderation_flags for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.get_creator_profile(p_creator_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_is_blocked boolean := false;
  v_is_blocking boolean := false;
  v_is_following boolean := false;
  v_follower_count integer := 0;
  v_following_count integer := 0;
  v_published_count integer := 0;
  v_designs jsonb := '[]'::jsonb;
  v_collections jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select * into v_profile from public.profiles where id = p_creator_id;
  if not found then
    return null;
  end if;

  select exists (
    select 1 from public.blocks b
    where b.blocker_id = v_uid and b.blocked_id = p_creator_id
  ) into v_is_blocking;

  select exists (
    select 1 from public.blocks b
    where b.blocker_id = p_creator_id and b.blocked_id = v_uid
  ) into v_is_blocked;

  select exists (
    select 1 from public.follows f
    where f.follower_id = v_uid and f.following_id = p_creator_id
  ) into v_is_following;

  select count(*)::integer into v_follower_count
  from public.follows where following_id = p_creator_id;

  select count(*)::integer into v_following_count
  from public.follows where follower_id = p_creator_id;

  select count(*)::integer into v_published_count
  from public.designs
  where creator_id = p_creator_id and status = 'published';

  if not v_is_blocked and coalesce(v_profile.account_status, 'active') = 'active' then
    select coalesce(jsonb_agg(row_to_json(x)::jsonb order by x.created_at desc), '[]'::jsonb)
      into v_designs
    from (
      select
        d.id,
        d.title,
        d.provenance,
        d.save_count,
        d.created_at,
        (
          select di.image_url
          from public.design_images di
          where di.design_id = d.id
          order by di.sort_order, di.created_at
          limit 1
        ) as image_url,
        (
          select di.thumbnail_url
          from public.design_images di
          where di.design_id = d.id
          order by di.sort_order, di.created_at
          limit 1
        ) as thumbnail_url
      from public.designs d
      where d.creator_id = p_creator_id
        and d.status = 'published'
      order by d.created_at desc
      limit 60
    ) x;

    select coalesce(jsonb_agg(row_to_json(c)::jsonb order by c.updated_at desc), '[]'::jsonb)
      into v_collections
    from public.collections c
    where c.user_id = p_creator_id
      and c.is_private = false
      and c.is_default = false;
  end if;

  return jsonb_build_object(
    'id', v_profile.id,
    'username', v_profile.username,
    'display_name', v_profile.display_name,
    'avatar_url', v_profile.avatar_url,
    'bio', v_profile.bio,
    'website_url', v_profile.website_url,
    'account_status', coalesce(v_profile.account_status, 'active'),
    'is_self', v_profile.id = v_uid,
    'is_following', v_is_following,
    'is_blocking', v_is_blocking,
    'is_blocked_by_them', v_is_blocked,
    'follower_count', v_follower_count,
    'following_count', v_following_count,
    'published_design_count', v_published_count,
    'designs', v_designs,
    'public_collections', v_collections
  );
end;
$$;

revoke all on function public.get_creator_profile(uuid) from public;
grant execute on function public.get_creator_profile(uuid) to authenticated;

-- Soft-delete design: mark removed and leave storage cleanup to client/owner.
create or replace function public.delete_own_design(p_design_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select creator_id into v_owner from public.designs where id = p_design_id for update;
  if not found or v_owner <> v_uid then
    raise exception 'Design not found' using errcode = '42501';
  end if;

  update public.designs
  set status = 'removed', updated_at = timezone('utc', now())
  where id = p_design_id;

  return true;
end;
$$;

revoke all on function public.delete_own_design(uuid) from public;
grant execute on function public.delete_own_design(uuid) to authenticated;
