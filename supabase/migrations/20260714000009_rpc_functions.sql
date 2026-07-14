-- Application RPCs: discovery, swipe, undo, counters, collection helpers.

create or replace function public.adjust_design_save_count(
  p_design_id uuid,
  p_delta integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_delta = 0 then
    select save_count into v_count from public.designs where id = p_design_id;
    return coalesce(v_count, 0);
  end if;

  update public.designs
  set save_count = greatest(save_count + p_delta, 0)
  where id = p_design_id
  returning save_count into v_count;

  if not found then
    raise exception 'Design not found: %', p_design_id using errcode = 'P0002';
  end if;

  return v_count;
end;
$$;

revoke all on function public.adjust_design_save_count(uuid, integer) from public;
grant execute on function public.adjust_design_save_count(uuid, integer) to authenticated;

create or replace function public.increment_design_view_count(p_design_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  update public.designs
  set view_count = view_count + 1
  where id = p_design_id
    and status = 'published'
  returning view_count into v_count;

  if not found then
    raise exception 'Published design not found: %', p_design_id using errcode = 'P0002';
  end if;

  return v_count;
end;
$$;

revoke all on function public.increment_design_view_count(uuid) from public;
grant execute on function public.increment_design_view_count(uuid) to authenticated;

-- Adds a design to the caller's default Saved collection and bumps save_count once.
create or replace function public.add_right_swipe_to_default_collection(
  p_user_id uuid,
  p_design_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_collection_id uuid;
  v_item_id uuid;
begin
  select c.id into v_collection_id
  from public.collections c
  where c.user_id = p_user_id and c.is_default = true
  for update;

  if v_collection_id is null then
    insert into public.collections (user_id, name, description, is_private, is_default)
    values (p_user_id, 'Saved', 'Designs you swipe right on.', true, true)
    returning id into v_collection_id;
  end if;

  insert into public.collection_items (collection_id, design_id)
  values (v_collection_id, p_design_id)
  on conflict (collection_id, design_id) do nothing
  returning id into v_item_id;

  if v_item_id is not null then
    perform public.adjust_design_save_count(p_design_id, 1);
  end if;

  return v_item_id;
end;
$$;

revoke all on function public.add_right_swipe_to_default_collection(uuid, uuid) from public;
-- Internal helper; authenticated path goes through record_swipe.
grant execute on function public.add_right_swipe_to_default_collection(uuid, uuid) to authenticated;

create or replace function public.get_unseen_designs(p_limit integer default 20)
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
  v_uid uuid := auth.uid();
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 50));
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  return query
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
    coalesce(
      (
        select array_agg(t.name order by t.name)
        from public.design_tags dt
        join public.tags t on t.id = dt.tag_id
        where dt.design_id = d.id
      ),
      '{}'::text[]
    ) as tags
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
    and d.creator_id <> v_uid
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
                select 1
                from public.designs source
                where source.id = df.design_id
                  and source.creator_id = d.creator_id
              )
            )
          )
          or (
            df.feedback_type = 'hide_tag'
            and exists (
              select 1
              from public.design_tags dt
              join public.tags t on t.id = dt.tag_id
              where dt.design_id = d.id
                and (
                  t.slug = df.metadata ->> 'tag_slug'
                  or t.id::text = df.metadata ->> 'tag_id'
                )
            )
          )
          or (
            df.feedback_type = 'hide_style'
            and exists (
              select 1
              from public.design_tags dt
              join public.tags t on t.id = dt.tag_id
              where dt.design_id = d.id
                and t.slug = df.metadata ->> 'style_slug'
            )
          )
        )
    )
  order by d.is_featured desc, d.created_at desc
  limit v_limit;
end;
$$;

revoke all on function public.get_unseen_designs(integer) from public;
grant execute on function public.get_unseen_designs(integer) to authenticated;

create or replace function public.record_swipe(
  p_design_id uuid,
  p_direction public.swipe_direction
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_swipe public.swipes%rowtype;
  v_collection_item_id uuid;
  v_save_count integer;
  v_design public.designs%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_design_id is null then
    raise exception 'design_id is required' using errcode = '22023';
  end if;

  select * into v_design
  from public.designs
  where id = p_design_id
    and status = 'published'
  for share;

  if not found then
    raise exception 'Published design not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.swipes s
    where s.user_id = v_uid and s.design_id = p_design_id
  ) then
    raise exception 'Swipe already exists for this design' using errcode = '23505';
  end if;

  insert into public.swipes (user_id, design_id, direction)
  values (v_uid, p_design_id, p_direction)
  returning * into v_swipe;

  v_collection_item_id := null;
  v_save_count := v_design.save_count;

  if p_direction = 'right' then
    v_collection_item_id := public.add_right_swipe_to_default_collection(v_uid, p_design_id);
    select save_count into v_save_count from public.designs where id = p_design_id;
  end if;

  return jsonb_build_object(
    'swipe_id', v_swipe.id,
    'design_id', v_swipe.design_id,
    'direction', v_swipe.direction,
    'created_at', v_swipe.created_at,
    'collection_item_id', v_collection_item_id,
    'save_count', v_save_count
  );
end;
$$;

revoke all on function public.record_swipe(uuid, public.swipe_direction) from public;
grant execute on function public.record_swipe(uuid, public.swipe_direction) to authenticated;

create or replace function public.undo_last_swipe()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_swipe public.swipes%rowtype;
  v_default_collection_id uuid;
  v_removed_item boolean := false;
  v_save_count integer;
  v_design jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select * into v_swipe
  from public.swipes
  where user_id = v_uid
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'No swipe to undo' using errcode = 'P0002';
  end if;

  select save_count into v_save_count from public.designs where id = v_swipe.design_id;

  if v_swipe.direction = 'right' then
    select c.id into v_default_collection_id
    from public.collections c
    where c.user_id = v_uid and c.is_default = true
    for update;

    if v_default_collection_id is not null then
      delete from public.collection_items ci
      where ci.collection_id = v_default_collection_id
        and ci.design_id = v_swipe.design_id;

      if found then
        v_removed_item := true;
        v_save_count := public.adjust_design_save_count(v_swipe.design_id, -1);
      end if;
    end if;
  end if;

  delete from public.swipes where id = v_swipe.id;

  select jsonb_build_object(
    'id', d.id,
    'creator_id', d.creator_id,
    'title', d.title,
    'description', d.description,
    'category_id', d.category_id,
    'source_url', d.source_url,
    'platform', d.platform,
    'industry', d.industry,
    'provenance', d.provenance,
    'status', d.status,
    'is_featured', d.is_featured,
    'save_count', d.save_count,
    'view_count', d.view_count,
    'created_at', d.created_at,
    'updated_at', d.updated_at,
    'primary_image_url', di.image_url,
    'primary_thumbnail_url', di.thumbnail_url
  )
  into v_design
  from public.designs d
  left join lateral (
    select img.image_url, img.thumbnail_url
    from public.design_images img
    where img.design_id = d.id
    order by img.sort_order asc, img.created_at asc
    limit 1
  ) di on true
  where d.id = v_swipe.design_id;

  return jsonb_build_object(
    'undone_swipe_id', v_swipe.id,
    'direction', v_swipe.direction,
    'removed_from_default_collection', v_removed_item,
    'save_count', v_save_count,
    'design', v_design
  );
end;
$$;

revoke all on function public.undo_last_swipe() from public;
grant execute on function public.undo_last_swipe() to authenticated;

create or replace function public.add_design_to_collection(
  p_collection_id uuid,
  p_design_id uuid,
  p_note text default null,
  p_saved_aspect public.saved_aspect default null
)
returns public.collection_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item public.collection_items%rowtype;
  v_owner uuid;
  v_is_default boolean;
  v_existed boolean := false;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select user_id, is_default into v_owner, v_is_default
  from public.collections
  where id = p_collection_id
  for update;

  if not found or v_owner <> v_uid then
    raise exception 'Collection not found' using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.collection_items ci
    where ci.collection_id = p_collection_id
      and ci.design_id = p_design_id
  ) into v_existed;

  insert into public.collection_items (collection_id, design_id, note, saved_aspect)
  values (p_collection_id, p_design_id, p_note, p_saved_aspect)
  on conflict (collection_id, design_id) do update
    set
      note = coalesce(excluded.note, public.collection_items.note),
      saved_aspect = coalesce(excluded.saved_aspect, public.collection_items.saved_aspect)
  returning * into v_item;

  if v_is_default and not v_existed then
    perform public.adjust_design_save_count(p_design_id, 1);
  end if;

  return v_item;
end;
$$;

revoke all on function public.add_design_to_collection(uuid, uuid, text, public.saved_aspect) from public;
grant execute on function public.add_design_to_collection(uuid, uuid, text, public.saved_aspect) to authenticated;

create or replace function public.remove_design_from_collection(
  p_collection_id uuid,
  p_design_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_is_default boolean;
  v_deleted boolean := false;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select user_id, is_default into v_owner, v_is_default
  from public.collections
  where id = p_collection_id
  for update;

  if not found or v_owner <> v_uid then
    raise exception 'Collection not found' using errcode = '42501';
  end if;

  delete from public.collection_items
  where collection_id = p_collection_id
    and design_id = p_design_id;

  v_deleted := found;

  if v_deleted and v_is_default then
    perform public.adjust_design_save_count(p_design_id, -1);
  end if;

  return v_deleted;
end;
$$;

revoke all on function public.remove_design_from_collection(uuid, uuid) from public;
grant execute on function public.remove_design_from_collection(uuid, uuid) to authenticated;
