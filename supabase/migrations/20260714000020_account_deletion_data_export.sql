-- Account deletion + data-export request helpers for store compliance.
-- Policy: hard-delete the authenticated user's auth identity (cascades owned rows)
-- after removing storage objects under their user-id prefixes.

create or replace function public.request_data_export()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result jsonb;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select jsonb_build_object(
    'requested_at', timezone('utc', now()),
    'user_id', uid,
    'status', 'queued',
    'message', 'A downloadable export will be emailed when available. This is a placeholder until the export worker is wired.',
    'profile', (
      select jsonb_build_object(
        'username', p.username,
        'display_name', p.display_name,
        'bio', p.bio,
        'created_at', p.created_at
      )
      from public.profiles p
      where p.id = uid
    ),
    'counts', jsonb_build_object(
      'designs', (select count(*) from public.designs d where d.creator_id = uid),
      'collections', (select count(*) from public.collections c where c.user_id = uid),
      'swipes', (select count(*) from public.swipes s where s.user_id = uid),
      'follows', (select count(*) from public.follows f where f.follower_id = uid)
    )
  )
  into result;

  return result;
end;
$$;

revoke all on function public.request_data_export() from public;
grant execute on function public.request_data_export() to authenticated;

create or replace function public.delete_own_account()
returns jsonb
language plpgsql
security definer
set search_path = public, storage, auth
as $$
declare
  uid uuid := auth.uid();
  deleted_designs integer := 0;
  deleted_objects integer := 0;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Soft-remove published work first so feeds stop showing it immediately.
  update public.designs
  set status = 'removed',
      updated_at = timezone('utc', now())
  where creator_id = uid;
  get diagnostics deleted_designs = row_count;

  -- Remove storage objects owned by or prefixed with this user id.
  delete from storage.objects
  where bucket_id in ('avatars', 'design-images', 'collection-covers')
    and (
      owner = uid
      or name like uid::text || '/%'
    );
  get diagnostics deleted_objects = row_count;

  -- Hard-delete identity. Cascades profiles and owned application rows via FKs.
  delete from auth.users where id = uid;

  if not found then
    raise exception 'Account deletion failed';
  end if;

  return jsonb_build_object(
    'ok', true,
    'deleted_designs', deleted_designs,
    'deleted_storage_objects', deleted_objects
  );
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

comment on function public.delete_own_account() is
  'Authenticated self-service account deletion for store compliance. Cascades owned data.';

comment on function public.request_data_export() is
  'Placeholder data-export request returning a JSON summary until an async export worker exists.';
