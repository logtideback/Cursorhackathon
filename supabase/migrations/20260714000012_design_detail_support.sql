-- Design detail support: expanded report reasons + creator account status.

alter type public.report_reason add value if not exists 'stolen_work';
alter type public.report_reason add value if not exists 'broken_source';

create type public.account_status as enum (
  'active',
  'suspended'
);

alter table public.profiles
  add column if not exists account_status public.account_status not null default 'active';

create index if not exists profiles_account_status_idx
  on public.profiles (account_status)
  where account_status <> 'active';

-- Similar designs for detail screen (excludes current, blocked, and hidden creators).
create or replace function public.get_similar_designs(
  p_design_id uuid,
  p_limit integer default 12
)
returns table (
  id uuid,
  creator_id uuid,
  title text,
  description text,
  category_id uuid,
  source_url text,
  platform text,
  industry text,
  provenance public.design_provenance,
  status public.design_status,
  is_featured boolean,
  save_count integer,
  view_count integer,
  created_at timestamptz,
  updated_at timestamptz,
  creator_username text,
  creator_display_name text,
  creator_avatar_url text,
  primary_image_url text,
  primary_thumbnail_url text,
  tags text[]
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_category_id uuid;
  v_industry text;
  v_platform text;
  v_creator_id uuid;
  v_limit integer := greatest(1, least(coalesce(p_limit, 12), 24));
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select d.category_id, d.industry, d.platform, d.creator_id
    into v_category_id, v_industry, v_platform, v_creator_id
  from public.designs d
  where d.id = p_design_id
    and d.status = 'published';

  if not found then
    return;
  end if;

  return query
  with candidate as (
    select
      d.id,
      d.creator_id,
      d.title,
      d.description,
      d.category_id,
      d.source_url,
      d.platform,
      d.industry,
      d.provenance,
      d.status,
      d.is_featured,
      d.save_count,
      d.view_count,
      d.created_at,
      d.updated_at,
      p.username as creator_username,
      p.display_name as creator_display_name,
      p.avatar_url as creator_avatar_url,
      di.image_url as primary_image_url,
      di.thumbnail_url as primary_thumbnail_url,
      coalesce((
        select array_agg(t.name order by t.name)
        from public.design_tags dt
        join public.tags t on t.id = dt.tag_id
        where dt.design_id = d.id
      ), '{}'::text[]) as tags,
      (
        case when v_category_id is not null and d.category_id = v_category_id then 4 else 0 end
        + case when v_industry is not null and d.industry is not null and d.industry = v_industry then 3 else 0 end
        + case when v_platform is not null and d.platform is not null and d.platform = v_platform then 2 else 0 end
        + case when d.creator_id = v_creator_id then 1 else 0 end
        + least(d.save_count, 50)::numeric / 50.0
      ) as similarity
    from public.designs d
    join public.profiles p on p.id = d.creator_id
    left join lateral (
      select img.image_url, img.thumbnail_url
      from public.design_images img
      where img.design_id = d.id
      order by img.sort_order asc, img.created_at asc
      limit 1
    ) di on true
    where d.status = 'published'
      and d.id <> p_design_id
      and p.account_status = 'active'
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = v_user_id and b.blocked_id = d.creator_id)
           or (b.blocker_id = d.creator_id and b.blocked_id = v_user_id)
      )
      and not exists (
        select 1 from public.design_feedback f
        where f.user_id = v_user_id
          and f.feedback_type = 'hide_creator'
          and (
            f.design_id = d.id
            or (f.metadata->>'creator_id') = d.creator_id::text
          )
      )
      and not exists (
        select 1 from public.design_feedback f
        where f.user_id = v_user_id
          and f.feedback_type = 'show_less'
          and f.design_id = d.id
      )
  )
  select
    c.id,
    c.creator_id,
    c.title,
    c.description,
    c.category_id,
    c.source_url,
    c.platform,
    c.industry,
    c.provenance,
    c.status,
    c.is_featured,
    c.save_count,
    c.view_count,
    c.created_at,
    c.updated_at,
    c.creator_username,
    c.creator_display_name,
    c.creator_avatar_url,
    c.primary_image_url,
    c.primary_thumbnail_url,
    c.tags
  from candidate c
  where c.similarity > 0
     or c.is_featured
  order by c.similarity desc, c.save_count desc, c.created_at desc
  limit v_limit;
end;
$$;

revoke all on function public.get_similar_designs(uuid, integer) from public;
grant execute on function public.get_similar_designs(uuid, integer) to authenticated;

create or replace function public.count_published_designs(p_creator_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.designs d
  where d.creator_id = p_creator_id
    and d.status = 'published';
$$;

revoke all on function public.count_published_designs(uuid) from public;
grant execute on function public.count_published_designs(uuid) to authenticated;
