-- Deterministic recommendation ranking for Taste Discover.
-- Mirrors src/features/discover/recommendation scoring intent on the server
-- so clients never pull the full designs table to rank locally.

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
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  return query
  with prefs as (
    select
      coalesce(up.preferred_categories, '{}') as preferred_categories,
      coalesce(up.preferred_styles, '{}') as preferred_styles,
      coalesce(up.preferred_platforms, '{}') as preferred_platforms,
      coalesce(up.preferred_industries, '{}') as preferred_industries,
      coalesce(up.preferred_colour_families, '{}') as preferred_colour_families,
      coalesce(up.disliked_tags, '{}') as disliked_tags
    from public.user_preferences up
    where up.user_id = v_uid
    union all
    select '{}','{}','{}','{}','{}','{}'
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
      coalesce((
        select array_agg(lower(t.slug) order by t.slug)
        from public.design_tags dt
        join public.tags t on t.id = dt.tag_id
        where dt.design_id = d.id
      ), '{}'::text[]) as style_slugs,
      '{}'::text[] as colour_families
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
      0.0::numeric as colour_match,
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
  with_exploration as (
    select
      s.*,
      (
        s.category_match * 0.35 +
        s.style_match * 0.35 +
        coalesce(s.tag_similarity, 0) * 0.2 +
        s.platform_match * 0.05 +
        s.industry_match * 0.05
      ) as affinity
    from scored s
  ),
  final_scores as (
    select
      e.*,
      case
        when e.affinity < 0.2 then least(1.0, 0.55 + e.popularity_score * 0.25)
        when e.affinity < 0.45 then 0.25
        else 0.0
      end as exploration_bonus,
      (
        e.category_match * 4 +
        e.style_match * 4 +
        coalesce(e.tag_similarity, 0) * 3 +
        e.platform_match * 2 +
        e.industry_match * 2 +
        e.colour_match * 2 +
        e.followed_creator * 3 +
        e.popularity_score * 1.5 +
        e.freshness_score * 1.5 +
        case
          when e.affinity < 0.2 then least(1.0, 0.55 + e.popularity_score * 0.25)
          when e.affinity < 0.45 then 0.25
          else 0.0
        end * 1
        - e.negative_tag_penalty * 4
        - e.explicit_show_less_penalty * 6
        - e.repetition_penalty * 3
        + case when e.user_swipe_total < 3 and e.is_featured then 1.2 else 0 end
      ) as final_score
    from with_exploration e
  ),
  reasoned as (
    select
      f.*,
      array_remove(array[
        case when f.user_swipe_total < 3 then 'cold_start' end,
        case when f.category_match > 0 then 'category_match' end,
        case when f.style_match >= 0.25 then 'style_match' end,
        case when coalesce(f.tag_similarity, 0) >= 0.15 then 'tag_similarity' end,
        case when f.platform_match > 0 then 'platform_match' end,
        case when f.industry_match > 0 then 'industry_match' end,
        case when f.followed_creator > 0 then 'followed_creator' end,
        case when f.popularity_score >= 0.55 then 'popular' end,
        case when f.freshness_score >= 0.7 then 'fresh' end,
        case when f.exploration_bonus >= 0.4 and f.category_match = 0 then 'exploration' end
      ], null)::text[] as reason_codes,
      jsonb_build_object(
        'finalScore', f.final_score,
        'components', jsonb_build_object(
          'categoryMatch', f.category_match,
          'styleMatch', f.style_match,
          'tagSimilarity', coalesce(f.tag_similarity, 0),
          'platformMatch', f.platform_match,
          'industryMatch', f.industry_match,
          'colourMatch', f.colour_match,
          'followedCreator', f.followed_creator,
          'popularityScore', f.popularity_score,
          'freshnessScore', f.freshness_score,
          'explorationBonus', f.exploration_bonus,
          'negativeTagPenalty', f.negative_tag_penalty,
          'explicitShowLessPenalty', f.explicit_show_less_penalty,
          'repetitionPenalty', f.repetition_penalty
        ),
        'weighted', jsonb_build_object(
          'categoryMatch', f.category_match * 4,
          'styleMatch', f.style_match * 4,
          'tagSimilarity', coalesce(f.tag_similarity, 0) * 3,
          'platformMatch', f.platform_match * 2,
          'industryMatch', f.industry_match * 2,
          'colourMatch', f.colour_match * 2,
          'followedCreator', f.followed_creator * 3,
          'popularityScore', f.popularity_score * 1.5,
          'freshnessScore', f.freshness_score * 1.5,
          'explorationBonus', f.exploration_bonus * 1,
          'negativeTagPenalty', f.negative_tag_penalty * 4,
          'explicitShowLessPenalty', f.explicit_show_less_penalty * 6,
          'repetitionPenalty', f.repetition_penalty * 3
        ),
        'penaltiesApplied', (
          select coalesce(jsonb_agg(value), '[]'::jsonb)
          from (
            select 'negative_tags' as value where f.negative_tag_penalty > 0
            union all
            select 'show_less' where f.explicit_show_less_penalty > 0
            union all
            select 'repetition' where f.repetition_penalty > 0
          ) penalties
        ),
        'isExploratory', (f.exploration_bonus >= 0.4 and f.category_match = 0),
        'isColdStart', (f.user_swipe_total < 3)
      ) as diagnostics
    from final_scores f
  ),
  ordered as (
    select *
    from reasoned
    order by
      case when 'exploration' = any (reason_codes) then 1 else 0 end asc,
      final_score desc,
      is_featured desc,
      created_at desc
  ),
  diversified as (
    select
      o.*,
      row_number() over (
        partition by o.creator_id
        order by o.final_score desc
      ) as creator_rank
    from ordered o
  )
  select
    d.id,
    d.creator_id,
    d.title,
    d.description,
    d.category_id,
    d.category_slug,
    d.category_name,
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
    d.creator_username,
    d.creator_display_name,
    d.creator_avatar_url,
    d.primary_image_url,
    d.primary_thumbnail_url,
    d.tag_names as tags,
    d.style_slugs,
    d.colour_families,
    d.final_score as score,
    d.reason_codes,
    d.diagnostics
  from diversified d
  where d.creator_rank <= 2
  order by d.final_score desc, d.created_at desc
  limit v_limit;
end;
$$;

revoke all on function public.get_recommended_designs(integer, uuid[]) from public;
grant execute on function public.get_recommended_designs(integer, uuid[]) to authenticated;

comment on function public.get_recommended_designs(integer, uuid[]) is
  'Deterministic Discover ranking with preference, popularity, feedback, and creator diversity filters.';
