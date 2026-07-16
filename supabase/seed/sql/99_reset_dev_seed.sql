-- Wipe development seed identities and cascading app data.
-- Safe for local/dev only. Identifies seed users via email domain @taste.local
-- and app_metadata.seed = true.
--
-- Prefer `npm run seed:reset` which also cleans orphaned storage.
-- This SQL is for dashboard / CLI use when you need a quick wipe.

do $$
declare
  seed_ids uuid[];
begin
  select coalesce(array_agg(id), '{}')
  into seed_ids
  from auth.users
  where email like '%@taste.local'
     or coalesce(raw_app_meta_data ->> 'seed', '') = 'true';

  if array_length(seed_ids, 1) is null then
    raise notice 'No Taste seed users found — nothing to reset.';
    return;
  end if;

  -- Explicit child cleanup for tables that might not cascade from auth in all setups.
  delete from public.design_feedback where user_id = any (seed_ids);
  delete from public.hidden_creators
    where hider_id = any (seed_ids)
       or hidden_id = any (seed_ids);
  delete from public.reports
    where reporter_id = any (seed_ids)
       or reported_creator_id = any (seed_ids);
  delete from public.blocks
    where blocker_id = any (seed_ids)
       or blocked_id = any (seed_ids);
  delete from public.follows
    where follower_id = any (seed_ids)
       or following_id = any (seed_ids);
  delete from public.swipes where user_id = any (seed_ids);
  delete from public.collection_items
    where collection_id in (select id from public.collections where user_id = any (seed_ids));
  delete from public.collections where user_id = any (seed_ids);
  delete from public.design_tags
    where design_id in (select id from public.designs where creator_id = any (seed_ids));
  delete from public.design_images
    where design_id in (select id from public.designs where creator_id = any (seed_ids));
  delete from public.designs where creator_id = any (seed_ids);
  delete from public.user_preferences where user_id = any (seed_ids);
  delete from public.profiles where id = any (seed_ids);

  delete from auth.users where id = any (seed_ids);

  raise notice 'Removed % Taste seed users and related rows.', array_length(seed_ids, 1);
end $$;
