-- Row Level Security for all Taste tables.

alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.designs enable row level security;
alter table public.design_images enable row level security;
alter table public.design_tags enable row level security;
alter table public.swipes enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.follows enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.design_feedback enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Categories / tags: public read; admin write.
create policy "Categories are readable by everyone"
  on public.categories for select
  using (true);

create policy "Admins manage categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Tags are readable by everyone"
  on public.tags for select
  using (true);

create policy "Admins manage tags"
  on public.tags for all
  using (public.is_admin())
  with check (public.is_admin());

-- Profiles
create policy "Profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Inserts happen via security definer signup trigger only.

-- Preferences: owner only
create policy "Users read own preferences"
  on public.user_preferences for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users update own preferences"
  on public.user_preferences for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users insert own preferences"
  on public.user_preferences for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Designs
create policy "Published designs are readable"
  on public.designs for select
  to authenticated
  using (
    status = 'published'
    or creator_id = auth.uid()
    or public.is_admin()
  );

create policy "Creators insert own designs"
  on public.designs for insert
  to authenticated
  with check (creator_id = auth.uid());

create policy "Creators update own designs"
  on public.designs for update
  to authenticated
  using (creator_id = auth.uid() or public.is_admin())
  with check (creator_id = auth.uid() or public.is_admin());

create policy "Creators delete own designs"
  on public.designs for delete
  to authenticated
  using (creator_id = auth.uid() or public.is_admin());

-- Design images follow parent design visibility / ownership
create policy "Design images readable with parent design"
  on public.design_images for select
  to authenticated
  using (
    exists (
      select 1
      from public.designs d
      where d.id = design_id
        and (
          d.status = 'published'
          or d.creator_id = auth.uid()
          or public.is_admin()
        )
    )
  );

create policy "Creators manage own design images"
  on public.design_images for all
  to authenticated
  using (
    exists (
      select 1 from public.designs d
      where d.id = design_id and (d.creator_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.designs d
      where d.id = design_id and (d.creator_id = auth.uid() or public.is_admin())
    )
  );

create policy "Design tags readable with parent design"
  on public.design_tags for select
  to authenticated
  using (
    exists (
      select 1
      from public.designs d
      where d.id = design_id
        and (
          d.status = 'published'
          or d.creator_id = auth.uid()
          or public.is_admin()
        )
    )
  );

create policy "Creators manage own design tags"
  on public.design_tags for all
  to authenticated
  using (
    exists (
      select 1 from public.designs d
      where d.id = design_id and (d.creator_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.designs d
      where d.id = design_id and (d.creator_id = auth.uid() or public.is_admin())
    )
  );

-- Swipes: owner only
create policy "Users read own swipes"
  on public.swipes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own swipes"
  on public.swipes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users delete own swipes"
  on public.swipes for delete
  to authenticated
  using (auth.uid() = user_id);

-- Collections
create policy "Users read accessible collections"
  on public.collections for select
  to authenticated
  using (user_id = auth.uid() or is_private = false or public.is_admin());

create policy "Users insert own collections"
  on public.collections for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users update own collections"
  on public.collections for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own non-default collections"
  on public.collections for delete
  to authenticated
  using (user_id = auth.uid() and is_default = false);

-- Collection items
create policy "Users read accessible collection items"
  on public.collection_items for select
  to authenticated
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id
        and (c.user_id = auth.uid() or c.is_private = false or public.is_admin())
    )
  );

create policy "Users manage items in own collections"
  on public.collection_items for all
  to authenticated
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

-- Follows
create policy "Follows are readable by authenticated users"
  on public.follows for select
  to authenticated
  using (true);

create policy "Users follow as themselves"
  on public.follows for insert
  to authenticated
  with check (follower_id = auth.uid());

create policy "Users unfollow as themselves"
  on public.follows for delete
  to authenticated
  using (follower_id = auth.uid());

-- Reports
create policy "Users read own reports"
  on public.reports for select
  to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

create policy "Users create reports"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "Admins update reports"
  on public.reports for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Blocks
create policy "Users manage own blocks"
  on public.blocks for all
  to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

-- Design feedback
create policy "Users manage own design feedback"
  on public.design_feedback for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
