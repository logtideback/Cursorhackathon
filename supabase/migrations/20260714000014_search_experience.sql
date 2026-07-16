-- Search: FTS columns, indexes, and typed RPCs.

alter table public.designs
  add column if not exists style_slugs text[] not null default '{}'::text[],
  add column if not exists colour_families text[] not null default '{}'::text[];

-- Full-text search document for designs.
alter table public.designs
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(description, '')), 'B')
    || setweight(to_tsvector('english', coalesce(platform, '')), 'C')
    || setweight(to_tsvector('english', coalesce(industry, '')), 'C')
  ) stored;

alter table public.profiles
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(display_name, '')), 'A')
    || setweight(to_tsvector('english', coalesce(username, '')), 'A')
    || setweight(to_tsvector('english', coalesce(bio, '')), 'B')
  ) stored;

create extension if not exists pg_trgm;

create index if not exists designs_search_vector_idx on public.designs using gin (search_vector);
create index if not exists designs_style_slugs_gin_idx on public.designs using gin (style_slugs);
create index if not exists designs_colour_families_gin_idx on public.designs using gin (colour_families);
create index if not exists designs_platform_lower_idx on public.designs (lower(platform));
create index if not exists designs_industry_lower_idx on public.designs (lower(industry));
create index if not exists designs_provenance_idx on public.designs (provenance);
create index if not exists designs_status_created_at_idx on public.designs (status, created_at desc);
create index if not exists designs_status_save_count_idx on public.designs (status, save_count desc);
create index if not exists profiles_search_vector_idx on public.profiles using gin (search_vector);
create index if not exists categories_name_trgm_idx on public.categories using gin (name gin_trgm_ops);
create index if not exists tags_name_trgm_idx on public.tags using gin (name gin_trgm_ops);

-- Sanitize plain user input into a safe tsquery (or null for empty).
create or replace function public.taste_search_tsquery(p_query text)
returns tsquery
language plpgsql
immutable
as $$
declare
  v_clean text;
begin
  v_clean := left(trim(both from coalesce(p_query, '')), 100);
  v_clean := regexp_replace(v_clean, '[\u0000]', '', 'g');
  if v_clean = '' then
    return null;
  end if;
  begin
    return websearch_to_tsquery('english', v_clean);
  exception when others then
    return plainto_tsquery('english', v_clean);
  end;
end;
$$;

create or replace function public.search_designs(
  p_query text default null,
  p_limit integer default 24,
  p_offset integer default 0,
  p_category_slugs text[] default null,
  p_style_slugs text[] default null,
  p_platforms text[] default null,
  p_industries text[] default null,
  p_colour_families text[] default null,
  p_provenances public.design_provenance[] default null,
  p_creator_id uuid default null,
  p_date_from timestamptz default null,
  p_date_to timestamptz default null,
  p_popularity text default 'any',
  p_saved_status text default 'any',
  p_sort text default 'relevance'
)
returns table (
  id uuid,
  creator_id uuid,
  title text,
  description text,
  platform text,
  industry text,
  provenance public.design_provenance,
  save_count integer,
  view_count integer,
  created_at timestamptz,
  category_name text,
  category_slug text,
  creator_username text,
  creator_display_name text,
  creator_avatar_url text,
  primary_image_url text,
  primary_thumbnail_url text,
  tags text[],
  style_slugs text[],
  colour_families text[],
  rank real,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer := greatest(1, least(coalesce(p_limit, 24), 48));
  v_offset integer := greatest(0, coalesce(p_offset, 0));
  v_tsquery tsquery := public.taste_search_tsquery(p_query);
  v_popularity text := lower(coalesce(p_popularity, 'any'));
  v_saved text := lower(coalesce(p_saved_status, 'any'));
  v_sort text := lower(coalesce(p_sort, 'relevance'));
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  return query
  with filtered as (
    select
      d.id,
      d.creator_id,
      d.title,
      d.description,
      d.platform,
      d.industry,
      d.provenance,
      d.save_count,
      d.view_count,
      d.created_at,
      c.name as category_name,
      c.slug as category_slug,
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
      d.style_slugs,
      d.colour_families,
      case
        when v_tsquery is null then 0::real
        else ts_rank_cd(d.search_vector, v_tsquery)
      end as rank
    from public.designs d
    join public.profiles p on p.id = d.creator_id
    left join public.categories c on c.id = d.category_id
    left join lateral (
      select img.image_url, img.thumbnail_url
      from public.design_images img
      where img.design_id = d.id
      order by img.sort_order, img.created_at
      limit 1
    ) di on true
    where d.status = 'published'
      and coalesce(p.account_status, 'active') = 'active'
      and (v_tsquery is null or d.search_vector @@ v_tsquery
           or exists (
             select 1 from public.design_tags dt
             join public.tags t on t.id = dt.tag_id
             where dt.design_id = d.id
               and t.name ilike '%' || left(trim(coalesce(p_query, '')), 40) || '%'
           )
           or c.name ilike '%' || left(trim(coalesce(p_query, '')), 40) || '%'
          )
      and (p_category_slugs is null or cardinality(p_category_slugs) = 0 or c.slug = any (p_category_slugs))
      and (p_style_slugs is null or cardinality(p_style_slugs) = 0 or d.style_slugs && p_style_slugs)
      and (p_platforms is null or cardinality(p_platforms) = 0
           or lower(coalesce(d.platform, '')) = any (select lower(unnest(p_platforms))))
      and (p_industries is null or cardinality(p_industries) = 0
           or lower(coalesce(d.industry, '')) = any (select lower(unnest(p_industries))))
      and (p_colour_families is null or cardinality(p_colour_families) = 0
           or d.colour_families && p_colour_families)
      and (p_provenances is null or cardinality(p_provenances) = 0 or d.provenance = any (p_provenances))
      and (p_creator_id is null or d.creator_id = p_creator_id)
      and (p_date_from is null or d.created_at >= p_date_from)
      and (p_date_to is null or d.created_at <= p_date_to)
      and (
        v_popularity = 'any'
        or (v_popularity = 'popular' and d.save_count >= 50)
        or (v_popularity = 'rising' and d.created_at > timezone('utc', now()) - interval '30 days' and d.save_count >= 10)
      )
      and (
        v_saved = 'any'
        or (v_saved = 'saved' and exists (
          select 1
          from public.collection_items ci
          join public.collections col on col.id = ci.collection_id
          where col.user_id = v_uid and ci.design_id = d.id
        ))
        or (v_saved = 'unsaved' and not exists (
          select 1
          from public.collection_items ci
          join public.collections col on col.id = ci.collection_id
          where col.user_id = v_uid and ci.design_id = d.id
        ))
      )
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = v_uid and b.blocked_id = d.creator_id)
           or (b.blocker_id = d.creator_id and b.blocked_id = v_uid)
      )
      and not exists (
        select 1 from public.design_feedback df
        where df.user_id = v_uid
          and (
            (df.feedback_type = 'show_less' and df.design_id = d.id)
            or (
              df.feedback_type = 'hide_creator'
              and (df.metadata->>'creator_id') = d.creator_id::text
            )
          )
      )
  ),
  counted as (
    select count(*)::bigint as total_count from filtered
  )
  select
    f.*,
    counted.total_count
  from filtered f
  cross join counted
  order by
    case when v_sort = 'relevance' and v_tsquery is not null then f.rank else 0 end desc,
    case when v_sort = 'popular' then f.save_count else 0 end desc,
    case when v_sort = 'newest' then extract(epoch from f.created_at) else 0 end desc,
    f.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

revoke all on function public.search_designs from public;
grant execute on function public.search_designs to authenticated;

create or replace function public.search_creators(
  p_query text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  published_design_count integer,
  rank real,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 40));
  v_offset integer := greatest(0, coalesce(p_offset, 0));
  v_tsquery tsquery := public.taste_search_tsquery(p_query);
  v_like text := nullif('%' || left(trim(coalesce(p_query, '')), 40) || '%', '%%');
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  return query
  with filtered as (
    select
      p.id,
      p.username,
      p.display_name,
      p.avatar_url,
      p.bio,
      (
        select count(*)::integer
        from public.designs d
        where d.creator_id = p.id and d.status = 'published'
      ) as published_design_count,
      case
        when v_tsquery is null then 0::real
        else ts_rank_cd(p.search_vector, v_tsquery)
      end as rank
    from public.profiles p
    where coalesce(p.account_status, 'active') = 'active'
      and (
        v_tsquery is null
        or p.search_vector @@ v_tsquery
        or (v_like is not null and (p.username ilike v_like or p.display_name ilike v_like))
      )
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = v_uid and b.blocked_id = p.id)
           or (b.blocker_id = p.id and b.blocked_id = v_uid)
      )
  ),
  counted as (select count(*)::bigint as total_count from filtered)
  select f.*, counted.total_count
  from filtered f
  cross join counted
  order by f.rank desc, f.published_design_count desc, f.display_name asc nulls last
  limit v_limit
  offset v_offset;
end;
$$;

revoke all on function public.search_creators from public;
grant execute on function public.search_creators to authenticated;

create or replace function public.search_taxonomy(
  p_query text default null,
  p_kind text default 'all',
  p_limit integer default 20
)
returns table (
  kind text,
  id text,
  label text,
  slug text,
  meta text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 40));
  v_like text := nullif('%' || left(trim(coalesce(p_query, '')), 40) || '%', '%%');
  v_kind text := lower(coalesce(p_kind, 'all'));
begin
  return query
  (
    select 'category'::text, c.id::text, c.name, c.slug, c.description
    from public.categories c
    where v_kind in ('all', 'category')
      and (v_like is null or c.name ilike v_like or c.slug ilike v_like)
    order by c.name
    limit v_limit
  )
  union all
  (
    select 'tag'::text, t.id::text, t.name, t.slug, null::text
    from public.tags t
    where v_kind in ('all', 'tag')
      and (v_like is null or t.name ilike v_like or t.slug ilike v_like)
    order by t.name
    limit v_limit
  )
  union all
  (
    select distinct 'industry'::text, lower(d.industry), d.industry, lower(d.industry), null::text
    from public.designs d
    where v_kind in ('all', 'industry')
      and d.status = 'published'
      and d.industry is not null
      and (v_like is null or d.industry ilike v_like)
    order by 3
    limit v_limit
  )
  union all
  (
    select distinct 'platform'::text, lower(d.platform), d.platform, lower(d.platform), null::text
    from public.designs d
    where v_kind in ('all', 'platform')
      and d.status = 'published'
      and d.platform is not null
      and (v_like is null or d.platform ilike v_like)
    order by 3
    limit v_limit
  );
end;
$$;

revoke all on function public.search_taxonomy from public;
grant execute on function public.search_taxonomy to authenticated;

create or replace function public.get_trending_categories(p_limit integer default 8)
returns table (
  id uuid,
  name text,
  slug text,
  design_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.name,
    c.slug,
    count(d.id)::integer as design_count
  from public.categories c
  left join public.designs d
    on d.category_id = c.id
   and d.status = 'published'
   and d.created_at > timezone('utc', now()) - interval '90 days'
  group by c.id, c.name, c.slug
  order by count(d.id) desc, c.name asc
  limit greatest(1, least(coalesce(p_limit, 8), 20));
$$;

revoke all on function public.get_trending_categories(integer) from public;
grant execute on function public.get_trending_categories(integer) to authenticated;
