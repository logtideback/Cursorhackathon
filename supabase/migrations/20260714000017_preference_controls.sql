-- Preference controls: hide (≠ block), show-me-less targets, taste settings, taste profile.

create type public.exploration_level as enum ('focused', 'balanced', 'adventurous');

alter table public.user_preferences
  add column if not exists include_ai_assisted boolean not null default true,
  add column if not exists include_fully_ai_generated boolean not null default true,
  add column if not exists exploration_level public.exploration_level not null default 'balanced',
  add column if not exists disliked_colour_families text[] not null default '{}'::text[],
  add column if not exists disliked_layout_patterns text[] not null default '{}'::text[];

-- Hide creator without full block (soft mute for recommendations).
create table if not exists public.hidden_creators (
  hider_id uuid not null references public.profiles (id) on delete cascade,
  hidden_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (hider_id, hidden_id),
  constraint hidden_creators_no_self check (hider_id <> hidden_id)
);

create index if not exists hidden_creators_hider_id_idx on public.hidden_creators (hider_id);
create index if not exists hidden_creators_hidden_id_idx on public.hidden_creators (hidden_id);

alter table public.hidden_creators enable row level security;

create policy "Users read own hidden creators"
  on public.hidden_creators for select
  to authenticated
  using (hider_id = auth.uid());

create policy "Users insert own hidden creators"
  on public.hidden_creators for insert
  to authenticated
  with check (hider_id = auth.uid());

create policy "Users delete own hidden creators"
  on public.hidden_creators for delete
  to authenticated
  using (hider_id = auth.uid());

-- Append unique values to a text[] without duplicates.
create or replace function public.array_append_unique(source text[], additions text[])
returns text[]
language sql
immutable
as $$
  select coalesce(
    (
      select array_agg(distinct v order by v)
      from (
        select lower(trim(unnest(coalesce(source, '{}'::text[])))) as v
        union
        select lower(trim(unnest(coalesce(additions, '{}'::text[])))) as v
      ) x
      where v is not null and v <> ''
    ),
    '{}'::text[]
  );
$$;

-- Record show-me-less feedback and fold targets into preference arrays.
create or replace function public.apply_show_less_feedback(
  p_design_id uuid,
  p_targets text[] default '{}'::text[],
  p_style_slugs text[] default '{}'::text[],
  p_colour_families text[] default '{}'::text[],
  p_layout_patterns text[] default '{}'::text[],
  p_category_slug text default null,
  p_tags text[] default '{}'::text[],
  p_creator_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_feedback_id uuid;
  v_targets text[] := coalesce(p_targets, '{}'::text[]);
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  insert into public.design_feedback (user_id, design_id, feedback_type, metadata)
  values (
    v_uid,
    p_design_id,
    'show_less',
    jsonb_build_object(
      'targets', to_jsonb(v_targets),
      'style_slugs', to_jsonb(coalesce(p_style_slugs, '{}'::text[])),
      'colour_families', to_jsonb(coalesce(p_colour_families, '{}'::text[])),
      'layout_patterns', to_jsonb(coalesce(p_layout_patterns, '{}'::text[])),
      'category_slug', p_category_slug,
      'tags', to_jsonb(coalesce(p_tags, '{}'::text[])),
      'creator_id', p_creator_id
    )
  )
  returning id into v_feedback_id;

  insert into public.user_preferences (user_id)
  values (v_uid)
  on conflict (user_id) do nothing;

  update public.user_preferences up
  set
    disliked_styles = case
      when 'style' = any (v_targets) or 'this_style' = any (v_targets)
        then public.array_append_unique(up.disliked_styles, coalesce(p_style_slugs, '{}'::text[]))
      else up.disliked_styles
    end,
    disliked_colour_families = case
      when 'colour_family' = any (v_targets) or 'this_colour_family' = any (v_targets)
        then public.array_append_unique(up.disliked_colour_families, coalesce(p_colour_families, '{}'::text[]))
      else up.disliked_colour_families
    end,
    disliked_layout_patterns = case
      when 'layout_pattern' = any (v_targets) or 'this_layout_pattern' = any (v_targets)
        then public.array_append_unique(up.disliked_layout_patterns, coalesce(p_layout_patterns, '{}'::text[]))
      else up.disliked_layout_patterns
    end,
    disliked_categories = case
      when ('category' = any (v_targets) or 'this_category' = any (v_targets)) and p_category_slug is not null
        then public.array_append_unique(up.disliked_categories, array[p_category_slug])
      else up.disliked_categories
    end,
    disliked_tags = case
      when 'tags' = any (v_targets) or 'these_tags' = any (v_targets)
        then public.array_append_unique(up.disliked_tags, coalesce(p_tags, '{}'::text[]))
      else up.disliked_tags
    end,
    updated_at = timezone('utc', now())
  where up.user_id = v_uid;

  if ('creator' = any (v_targets) or 'this_creator' = any (v_targets)) and p_creator_id is not null then
    insert into public.hidden_creators (hider_id, hidden_id)
    values (v_uid, p_creator_id)
    on conflict do nothing;

    insert into public.design_feedback (user_id, design_id, feedback_type, metadata)
    values (
      v_uid,
      p_design_id,
      'hide_creator',
      jsonb_build_object('creator_id', p_creator_id, 'via', 'show_less')
    );
  end if;

  return jsonb_build_object('feedback_id', v_feedback_id, 'targets', to_jsonb(v_targets));
end;
$$;

revoke all on function public.apply_show_less_feedback(uuid, text[], text[], text[], text[], text, text[], uuid) from public;
grant execute on function public.apply_show_less_feedback(uuid, text[], text[], text[], text[], text, text[], uuid) to authenticated;

create or replace function public.hide_creator(p_creator_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if p_creator_id = v_uid then
    raise exception 'Cannot hide yourself' using errcode = '22023';
  end if;

  insert into public.hidden_creators (hider_id, hidden_id)
  values (v_uid, p_creator_id)
  on conflict do nothing;

  -- Soft signal for legacy filters that still read hide_creator feedback.
  insert into public.design_feedback (user_id, design_id, feedback_type, metadata)
  select v_uid, d.id, 'hide_creator', jsonb_build_object('creator_id', p_creator_id)
  from public.designs d
  where d.creator_id = p_creator_id and d.status = 'published'
  order by d.created_at desc
  limit 1;

  return true;
end;
$$;

revoke all on function public.hide_creator(uuid) from public;
grant execute on function public.hide_creator(uuid) to authenticated;

create or replace function public.unhide_creator(p_creator_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  delete from public.hidden_creators
  where hider_id = v_uid and hidden_id = p_creator_id;

  delete from public.design_feedback
  where user_id = v_uid
    and feedback_type = 'hide_creator'
    and metadata ->> 'creator_id' = p_creator_id::text;

  return true;
end;
$$;

revoke all on function public.unhide_creator(uuid) from public;
grant execute on function public.unhide_creator(uuid) to authenticated;

create or replace function public.reset_hidden_preferences()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  update public.user_preferences
  set
    disliked_categories = '{}',
    disliked_styles = '{}',
    disliked_tags = '{}',
    disliked_colour_families = '{}',
    disliked_layout_patterns = '{}',
    updated_at = timezone('utc', now())
  where user_id = v_uid;

  delete from public.design_feedback
  where user_id = v_uid
    and feedback_type in ('show_less', 'hide_tag', 'hide_style');

  return true;
end;
$$;

revoke all on function public.reset_hidden_preferences() from public;
grant execute on function public.reset_hidden_preferences() to authenticated;

create or replace function public.reset_recommendation_history()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  delete from public.swipes where user_id = v_uid;
  return true;
end;
$$;

revoke all on function public.reset_recommendation_history() from public;
grant execute on function public.reset_recommendation_history() to authenticated;

create or replace function public.get_taste_profile_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_styles jsonb;
  v_categories jsonb;
  v_colours jsonb;
  v_tags jsonb;
  v_platforms jsonb;
  v_industries jsonb;
  v_creators jsonb;
  v_recent jsonb;
  v_prior jsonb;
  v_shifts jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- Most-saved facets from collection items + right swipes (last 180 days).
  with saved as (
    select d.id, d.creator_id, d.category_id, d.platform, d.industry,
           d.style_slugs, d.colour_families, ci.created_at as saved_at
    from public.collection_items ci
    join public.collections c on c.id = ci.collection_id
    join public.designs d on d.id = ci.design_id
    where c.user_id = v_uid
      and ci.created_at > timezone('utc', now()) - interval '180 days'
  ),
  style_counts as (
    select lower(s.slug) as key, count(*)::int as count
    from saved, lateral unnest(saved.style_slugs) as s(slug)
    group by 1 order by 2 desc limit 8
  ),
  category_counts as (
    select coalesce(cat.slug, 'uncategorised') as key,
           coalesce(cat.name, 'Uncategorised') as label,
           count(*)::int as count
    from saved
    left join public.categories cat on cat.id = saved.category_id
    group by 1, 2 order by 3 desc limit 8
  ),
  colour_counts as (
    select lower(cf.family) as key, count(*)::int as count
    from saved, lateral unnest(saved.colour_families) as cf(family)
    group by 1 order by 2 desc limit 8
  ),
  tag_counts as (
    select lower(t.slug) as key, t.name as label, count(*)::int as count
    from saved
    join public.design_tags dt on dt.design_id = saved.id
    join public.tags t on t.id = dt.tag_id
    group by 1, 2 order by 3 desc limit 10
  ),
  platform_counts as (
    select lower(platform) as key, platform as label, count(*)::int as count
    from saved where platform is not null
    group by 1, 2 order by 3 desc limit 6
  ),
  industry_counts as (
    select lower(industry) as key, industry as label, count(*)::int as count
    from saved where industry is not null
    group by 1, 2 order by 3 desc limit 6
  ),
  creator_counts as (
    select p.id::text as key,
           coalesce(p.display_name, p.username, 'Creator') as label,
           count(*)::int as count
    from saved
    join public.profiles p on p.id = saved.creator_id
    group by 1, 2 order by 3 desc limit 6
  ),
  recent_window as (
    select * from saved
    where saved_at > timezone('utc', now()) - interval '30 days'
  ),
  prior_window as (
    select * from saved
    where saved_at <= timezone('utc', now()) - interval '30 days'
      and saved_at > timezone('utc', now()) - interval '90 days'
  ),
  recent_styles as (
    select lower(s.slug) as key, count(*)::int as count
    from recent_window, lateral unnest(recent_window.style_slugs) as s(slug)
    group by 1 order by 2 desc limit 5
  ),
  prior_styles as (
    select lower(s.slug) as key, count(*)::int as count
    from prior_window, lateral unnest(prior_window.style_slugs) as s(slug)
    group by 1 order by 2 desc limit 5
  ),
  style_shifts as (
    select
      r.key,
      r.count as recent_count,
      coalesce(p.count, 0) as prior_count
    from recent_styles r
    left join prior_styles p on p.key = r.key
    where r.count > coalesce(p.count, 0)
    order by (r.count - coalesce(p.count, 0)) desc
    limit 4
  )
  select
    coalesce((select jsonb_agg(jsonb_build_object('key', key, 'label', key, 'count', count) order by count desc) from style_counts), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('key', key, 'label', label, 'count', count) order by count desc) from category_counts), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('key', key, 'label', key, 'count', count) order by count desc) from colour_counts), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('key', key, 'label', label, 'count', count) order by count desc) from tag_counts), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('key', key, 'label', label, 'count', count) order by count desc) from platform_counts), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('key', key, 'label', label, 'count', count) order by count desc) from industry_counts), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('key', key, 'label', label, 'count', count) order by count desc) from creator_counts), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('key', key, 'count', count) order by count desc) from recent_styles), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('key', key, 'count', count) order by count desc) from prior_styles), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object(
      'key', key,
      'label', key,
      'direction', 'rising',
      'recent_count', recent_count,
      'prior_count', prior_count
    ) order by (recent_count - prior_count) desc) from style_shifts), '[]'::jsonb)
  into v_styles, v_categories, v_colours, v_tags, v_platforms, v_industries, v_creators, v_recent, v_prior, v_shifts;

  return jsonb_build_object(
    'styles', v_styles,
    'categories', v_categories,
    'colour_families', v_colours,
    'tags', v_tags,
    'platforms', v_platforms,
    'industries', v_industries,
    'creators', v_creators,
    'recent_styles', v_recent,
    'prior_styles', v_prior,
    'shifts', v_shifts,
    'generated_at', timezone('utc', now())
  );
end;
$$;

revoke all on function public.get_taste_profile_summary() from public;
grant execute on function public.get_taste_profile_summary() to authenticated;

create or replace function public.list_preference_controls()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_prefs public.user_preferences%rowtype;
  v_hidden jsonb;
  v_blocked jsonb;
  v_show_less jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select * into v_prefs from public.user_preferences where user_id = v_uid;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'username', p.username,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url,
    'hidden_at', h.created_at
  ) order by h.created_at desc), '[]'::jsonb)
  into v_hidden
  from public.hidden_creators h
  join public.profiles p on p.id = h.hidden_id
  where h.hider_id = v_uid;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'username', p.username,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url,
    'blocked_at', b.created_at
  ) order by b.created_at desc), '[]'::jsonb)
  into v_blocked
  from public.blocks b
  join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = v_uid;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', df.id,
    'design_id', df.design_id,
    'feedback_type', df.feedback_type,
    'metadata', df.metadata,
    'created_at', df.created_at,
    'title', d.title
  ) order by df.created_at desc), '[]'::jsonb)
  into v_show_less
  from public.design_feedback df
  join public.designs d on d.id = df.design_id
  where df.user_id = v_uid
    and df.feedback_type = 'show_less'
  limit 40;

  return jsonb_build_object(
    'preferences', case when v_prefs.id is null then null else to_jsonb(v_prefs) end,
    'hidden_creators', v_hidden,
    'blocked_creators', v_blocked,
    'show_less_history', v_show_less
  );
end;
$$;

revoke all on function public.list_preference_controls() from public;
grant execute on function public.list_preference_controls() to authenticated;
