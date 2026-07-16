-- Collections experience: public share access, reorder RPC, uniqueness, cover storage.

-- Prevent duplicate collection names per user (case-insensitive).
create unique index if not exists collections_user_lower_name_uidx
  on public.collections (user_id, lower(trim(name)));

-- Bump parent collection updated_at when items change (powers "recent" ordering).
create or replace function public.touch_collection_on_item_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.collections
  set updated_at = timezone('utc', now())
  where id = coalesce(new.collection_id, old.collection_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists collection_items_touch_collection on public.collection_items;
create trigger collection_items_touch_collection
after insert or update or delete on public.collection_items
for each row
execute function public.touch_collection_on_item_change();

-- Anon may read only public collections — never private ones.
create policy "Anon read public collections"
  on public.collections for select
  to anon
  using (is_private = false);

create policy "Anon read public collection items"
  on public.collection_items for select
  to anon
  using (
    exists (
      select 1
      from public.collections c
      where c.id = collection_id
        and c.is_private = false
    )
  );

-- Published design metadata readable by anon when attached to a public collection.
create policy "Anon read designs in public collections"
  on public.designs for select
  to anon
  using (
    status = 'published'
    and exists (
      select 1
      from public.collection_items ci
      join public.collections c on c.id = ci.collection_id
      where ci.design_id = designs.id
        and c.is_private = false
    )
  );

create policy "Anon read images for designs in public collections"
  on public.design_images for select
  to anon
  using (
    exists (
      select 1
      from public.designs d
      join public.collection_items ci on ci.design_id = d.id
      join public.collections c on c.id = ci.collection_id
      where d.id = design_images.design_id
        and d.status = 'published'
        and c.is_private = false
    )
  );

-- Reorder items with optimistic client payloads.
create or replace function public.reorder_collection_items(
  p_collection_id uuid,
  p_ordered_item_ids uuid[]
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_index integer := 0;
  v_item_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select user_id into v_owner
  from public.collections
  where id = p_collection_id
  for update;

  if not found or v_owner <> v_uid then
    raise exception 'Collection not found' using errcode = '42501';
  end if;

  if p_ordered_item_ids is null then
    return false;
  end if;

  foreach v_item_id in array p_ordered_item_ids
  loop
    update public.collection_items
    set sort_order = v_index
    where id = v_item_id
      and collection_id = p_collection_id;
    v_index := v_index + 1;
  end loop;

  update public.collections
  set updated_at = timezone('utc', now())
  where id = p_collection_id;

  return true;
end;
$$;

revoke all on function public.reorder_collection_items(uuid, uuid[]) from public;
grant execute on function public.reorder_collection_items(uuid, uuid[]) to authenticated;

-- Move item between collections (remove from source, upsert into target).
create or replace function public.move_design_between_collections(
  p_from_collection_id uuid,
  p_to_collection_id uuid,
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
  v_from_owner uuid;
  v_to_owner uuid;
  v_existing_note text;
  v_existing_aspect public.saved_aspect;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_from_collection_id = p_to_collection_id then
    raise exception 'Source and target collections are the same';
  end if;

  select user_id into v_from_owner from public.collections where id = p_from_collection_id;
  select user_id into v_to_owner from public.collections where id = p_to_collection_id;

  if v_from_owner is distinct from v_uid or v_to_owner is distinct from v_uid then
    raise exception 'Collection not found' using errcode = '42501';
  end if;

  select note, saved_aspect
    into v_existing_note, v_existing_aspect
  from public.collection_items
  where collection_id = p_from_collection_id
    and design_id = p_design_id;

  if not found then
    raise exception 'Design is not in the source collection';
  end if;

  perform public.remove_design_from_collection(p_from_collection_id, p_design_id);

  select * into v_item
  from public.add_design_to_collection(
    p_to_collection_id,
    p_design_id,
    coalesce(p_note, v_existing_note),
    coalesce(p_saved_aspect, v_existing_aspect)
  );

  return v_item;
end;
$$;

revoke all on function public.move_design_between_collections(uuid, uuid, uuid, text, public.saved_aspect) from public;
grant execute on function public.move_design_between_collections(uuid, uuid, uuid, text, public.saved_aspect) to authenticated;

-- Public collection payload for share links (private collections never leak).
create or replace function public.get_public_collection(p_collection_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_collection public.collections%rowtype;
  v_items jsonb;
begin
  select * into v_collection
  from public.collections
  where id = p_collection_id
    and is_private = false;

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(row_to_json(x)::jsonb order by x.sort_order, x.created_at desc), '[]'::jsonb)
    into v_items
  from (
    select
      ci.id,
      ci.design_id,
      ci.note,
      ci.saved_aspect,
      ci.sort_order,
      ci.created_at,
      d.title as design_title,
      d.status as design_status,
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
    from public.collection_items ci
    left join public.designs d on d.id = ci.design_id
    where ci.collection_id = p_collection_id
  ) x;

  return jsonb_build_object(
    'id', v_collection.id,
    'name', v_collection.name,
    'description', v_collection.description,
    'cover_image_url', v_collection.cover_image_url,
    'is_private', v_collection.is_private,
    'is_default', v_collection.is_default,
    'created_at', v_collection.created_at,
    'updated_at', v_collection.updated_at,
    'items', v_items
  );
end;
$$;

revoke all on function public.get_public_collection(uuid) from public;
grant execute on function public.get_public_collection(uuid) to anon, authenticated;

-- Cover image storage bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'collection-covers',
  'collection-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Collection covers are publicly readable"
  on storage.objects for select
  using (bucket_id = 'collection-covers');

create policy "Users upload own collection covers"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'collection-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own collection covers"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'collection-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'collection-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own collection covers"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'collection-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
