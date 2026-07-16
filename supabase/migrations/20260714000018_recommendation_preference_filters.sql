-- Extend recommendation ranking with hide/block/provenance/disliked facet filters.

create or replace function public.get_recommended_designs(
  p_limit integer default 12,
  p_exclude_ids uuid[] default '{}'::uuid[]
)
returns table (
  id uuid,
  creator_id uuid,
  title text,
  description text,
  category_id uuid,
  category_slug text,
  category_name text,
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
  tags text[],
  style_slugs text[],
  colour_families text[],
  score numeric,
  reason_codes text[],
  diagnostics jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer := greatest(1, least(coalesce(p_limit, 12), 50));
  v_exploration numeric := 1.0;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select case coalesce(up.exploration_level::text, 'balanced')
    when 'focused' then 0.45
    when 'adventurous' then 1.6
    else 1.0
  end
  into v_exploration
  from public.user_preferences up
  where up.user_id = v_uid;

  if v_exploration is null then
    v_exploration := 1.0;
  end if;

  return query
  with prefs as (
    select
      coalesce(up.preferred_categories, '{}') as preferred_categories,
      coalesce(up.preferred_styles, '{}') as preferred_styles,
      coalesce(up.preferred_platforms, '{}') as preferred_platforms,
      coalesce(up.preferred_industries, '{}') as preferred_industries,
      coalesce(up.preferred_colour_families, '{}') as preferred_colour_families,
      coalesce(up.disliked_tags, '{}') as disliked_tags,
      coalesce(up.disliked_categories, '{}') as disliked_categories,
      coalesce(up.disliked_styles, '{}') as disliked_styles,
      coalesce(up.disliked_colour_families, '{}') as disliked_colour_families,
      coalesce(up.disliked_layout_patterns, '{}') as disliked_layout_patterns,
      coalesce(up.include_ai_assisted, true) as include_ai_assisted,
      coalesce(up.include_fully_ai_generated, true) as include_fully_ai_generated
    from public.user_preferences up
    where up.user_id = v_uid
    union all
    select '{}','{}','{}','{}','{}','{}','{}','{}','{}','{}', true, true
    where not exists (select 1 from public.user_preferences where user_id = v_uid)
    limit 1
  ),
  liked_tags as (
    select coalesce(array_agg(distinct lower(t.slug)), '{}') as tags
    from public.swipes s
    join public.design_tags dt on dt.design_id = s.design_id
    join public.tags t on t.id = dt.tag_id
    where s.user_id = v_uid and s.direction = 'right'
  ),
  disliked_swipe_tags as (
    select coalesce(array_agg(distinct lower(t.slug)), '{}') as tags
    from public.swipes s
    join public.design_tags dt on dt.design_id = s.design_id
    join public.tags t on t.id = dt.tag_id
    where s.user_id = v_uid and s.direction = 'left'
  ),
  followed as (
    select coalesce(array_agg(f.following_id), '{}') as ids
    from public.follows f
    where f.follower_id = v_uid
  ),
  swipe_count as (
    select count(*)::int as total
    from public.swipes s
    where s.user_id = v_uid
  ),
  base as (
    select
      d.*,
      c.slug as category_slug,
      c.name as category_name,
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
      ), '{}'::text[]) as tag_names,
      coalesce(d.style_slugs, '{}'::text[]) as style_slugs,
      coalesce(d.colour_families, '{}'::text[]) as colour_families
    from public.designs d
    join public.profiles p on p.id = d.creator_id
    left join public.categories c on c.id = d.category_id
    left join lateral (
      select img.image_url, img.thumbnail_url
      from public.design_images img
      where img.design_id = d.id
      order by img.sort_order asc, img.created_at asc
      limit 1
    ) di on true
    cross join prefs
    where d.status = 'published'
      and d.creator_id <> v_uid
      and not (d.id = any (coalesce(p_exclude_ids, '{}'::uuid[])))
      and not exists (
        select 1 from public.swipes s
        where s.user_id = v_uid and s.design_id = d.id
      )
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = v_uid and b.blocked_id = d.creator_id)
           or (b.blocker_id = d.creator_id and b.blocked_id = v_uid)
      )
      and not exists (
        select 1 from public.hidden_creators h
        where h.hider_id = v_uid and h.hidden_id = d.creator_id
      )
      and not exists (
        select 1
        from public.design_feedback df
        where df.user_id = v_uid
          and (
            (df.feedback_type = 'show_less' and df.design_id = d.id)
            or (
              df.feedback_type = 'hide_creator'
              and (
                df.metadata ->> 'creator_id' = d.creator_id::text
                or exists (
                  select 1 from public.designs source
                  where source.id = df.design_id and source.creator_id = d.creator_id
                )
              )
            )
          )
      )
      and (
        prefs.include_ai_assisted
        or d.provenance is distinct from 'ai_assisted'::public.design_provenance
      )
      and (
        prefs.include_fully_ai_generated
        or d.provenance is distinct from 'fully_ai_generated'::public.design_provenance
      )
      and (
        cardinality(prefs.disliked_categories) = 0
        or c.slug is null
        or not (lower(c.slug) = any (select lower(unnest(prefs.disliked_categories))))
      )
      and (
        cardinality(prefs.disliked_styles) = 0
        or not exists (
          select 1 from unnest(coalesce(d.style_slugs, '{}'::text[])) s(slug)
          where lower(s.slug) = any (select lower(unnest(prefs.disliked_styles)))
        )
      )
      and (
        cardinality(prefs.disliked_colour_families) = 0
        or not exists (
          select 1 from unnest(coalesce(d.colour_families, '{}'::text[])) cf(family)
          where lower(cf.family) = any (select lower(unnest(prefs.disliked_colour_families)))
        )
      )
      and (
        cardinality(prefs.disliked_layout_patterns) = 0
        or not exists (
          select 1 from unnest(coalesce(d.style_slugs, '{}'::text[])) s(slug)
          where lower(s.slug) = any (select lower(unnest(prefs.disliked_layout_patterns)))
        )
      )
      and (
        cardinality(prefs.disliked_tags) = 0
        or not exists (
          select 1
          from public.design_tags dt
          join public.tags t on t.id = dt.tag_id
          where dt.design_id = d.id
            and lower(t.slug) = any (select lower(unnest(prefs.disliked_tags)))
        )
      )
  ),
  scored as (
    select
      b.*,
      prefs.*,
      liked_tags.tags as liked_tags,
      disliked_swipe_tags.tags as left_tags,
      followed.ids as followed_ids,
      swipe_count.total as user_swipe_total,
      case when b.category_slug is not null and lower(b.category_slug) = any (select lower(unnest(prefs.preferred_categories))) then 1.0 else 0.0 end as category_match,
      case
        when cardinality(prefs.preferred_styles) = 0 or cardinality(b.style_slugs) = 0 then 0.0
        else (
          select count(*)::numeric
          from unnest(b.style_slugs) s(slug)
          where lower(s.slug) = any (select lower(unnest(prefs.preferred_styles)))
        ) / greatest(cardinality(b.style_slugs), 1)
      end as style_match,
      case
        when cardinality(liked_tags.tags) = 0 or cardinality(b.style_slugs) = 0 then 0.0
        else (
          select count(*)::numeric
          from unnest(b.style_slugs) s(slug)
          where lower(s.slug) = any (liked_tags.tags)
        ) / nullif((
          select count(distinct x)::numeric from (
            select lower(unnest(b.style_slugs))
            union
            select unnest(liked_tags.tags)
          ) x
        ), 0)
      end as tag_similarity,
      case when b.platform is not null and lower(b.platform) = any (select lower(unnest(prefs.preferred_platforms))) then 1.0 else 0.0 end as platform_match,
      case when b.industry is not null and lower(b.industry) = any (select lower(unnest(prefs.preferred_industries))) then 1.0 else 0.0 end as industry_match,
      case
        when cardinality(prefs.preferred_colour_families) = 0 or cardinality(b.colour_families) = 0 then 0.0
        else (
          select count(*)::numeric from unnest(b.colour_families) cf(family)
          where lower(cf.family) = any (select lower(unnest(prefs.preferred_colour_families)))
        ) / greatest(cardinality(b.colour_families), 1)
      end as colour_match,
      case when b.creator_id = any (followed.ids) then 1.0 else 0.0 end as followed_creator,
      least(1.0, (ln(1 + b.save_count) * 1.4 + ln(1 + b.view_count)) / 12.0) as popularity_score,
      case
        when extract(epoch from (timezone('utc', now()) - b.created_at)) / 86400.0 <= 2 then 1.0
        when extract(epoch from (timezone('utc', now()) - b.created_at)) / 86400.0 >= 60 then 0.0
        else greatest(0.0, 1.0 - ((extract(epoch from (timezone('utc', now()) - b.created_at)) / 86400.0) - 2) / 58.0)
      end as freshness_score,
      case
        when cardinality(disliked_swipe_tags.tags) = 0 then 0.0
        else least(1.0, (
          select count(*)::numeric from unnest(b.style_slugs) s(slug)
          where lower(s.slug) = any (disliked_swipe_tags.tags || prefs.disliked_tags)
        ) / greatest(cardinality(b.style_slugs), 1))
      end as negative_tag_penalty,
      0.0::numeric as explicit_show_less_penalty,
      0.0::numeric as repetition_penalty
    from base b
    cross join prefs
    cross join liked_tags
    cross join disliked_swipe_tags
    cross join followed
    cross join swipe_count
  ),
  final as (
    select
      s.*,
      (
        s.category_match * 4
        + s.style_match * 4
        + s.tag_similarity * 3
        + s.platform_match * 2
        + s.industry_match * 2
        + s.colour_match * 2
        + s.followed_creator * 3
        + s.popularity_score * 1.5
        + s.freshness_score * 1.5
        + case
            when (s.category_match * 0.35 + s.style_match * 0.35 + s.tag_similarity * 0.2) < 0.2
              then least(1.0, 0.55 + s.popularity_score * 0.25) * v_exploration
            when (s.category_match * 0.35 + s.style_match * 0.35 + s.tag_similarity * 0.2) < 0.45
              then 0.25 * v_exploration
            else 0.0
          end
        - s.negative_tag_penalty * 4
        - s.explicit_show_less_penalty * 6
        - s.repetition_penalty * 3
      ) as rank_score,
      case
        when s.user_swipe_total < 3
          and cardinality(s.preferred_categories) = 0
          and cardinality(s.preferred_styles) = 0
        then true
        else false
      end as is_cold_start
    from scored s
  ),
  ranked as (
    select
      f.*,
      row_number() over (partition by f.creator_id order by f.rank_score desc, f.created_at desc) as creator_rank
    from final f
  )
  select
    r.id,
    r.creator_id,
    r.title,
    r.description,
    r.category_id,
    r.category_slug,
    r.category_name,
    r.source_url,
    r.platform,
    r.industry,
    r.provenance,
    r.status,
    r.is_featured,
    r.save_count,
    r.view_count,
    r.created_at,
    r.updated_at,
    r.creator_username,
    r.creator_display_name,
    r.creator_avatar_url,
    r.primary_image_url,
    r.primary_thumbnail_url,
    r.tag_names as tags,
    r.style_slugs,
    r.colour_families,
    r.rank_score as score,
    (
      select coalesce(array_agg(code), '{}'::text[])
      from (
        select 'followed_creator' as code where r.followed_creator > 0
        union all select 'category_match' where r.category_match > 0
        union all select 'style_match' where r.style_match >= 0.25
        union all select 'tag_similarity' where r.tag_similarity >= 0.15
        union all select 'exploration' where r.category_match = 0 and r.style_match < 0.25
        union all select 'cold_start' where r.is_cold_start
        union all select 'platform_match' where r.platform_match > 0
        union all select 'industry_match' where r.industry_match > 0
        union all select 'colour_match' where r.colour_match >= 0.25
        union all select 'popular' where r.popularity_score >= 0.55
        union all select 'fresh' where r.freshness_score >= 0.7
      ) codes
      limit 4
    ) as reason_codes,
    jsonb_build_object(
      'finalScore', r.rank_score,
      'isColdStart', r.is_cold_start,
      'isExploratory', r.category_match = 0 and r.style_match < 0.25,
      'components', jsonb_build_object(
        'categoryMatch', r.category_match,
        'styleMatch', r.style_match,
        'tagSimilarity', r.tag_similarity,
        'platformMatch', r.platform_match,
        'industryMatch', r.industry_match,
        'colourMatch', r.colour_match,
        'followedCreator', r.followed_creator,
        'popularityScore', r.popularity_score,
        'freshnessScore', r.freshness_score,
        'negativeTagPenalty', r.negative_tag_penalty
      )
    ) as diagnostics
  from ranked r
  where r.creator_rank <= 2
  order by r.rank_score desc, r.created_at desc
  limit v_limit;
end;
$$;

revoke all on function public.get_recommended_designs(integer, uuid[]) from public;
grant execute on function public.get_recommended_designs(integer, uuid[]) to authenticated;
