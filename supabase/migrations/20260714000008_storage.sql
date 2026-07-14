-- Storage buckets and policies for avatars + design images.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'design-images',
    'design-images',
    true,
    15728640,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Avatars: public read; users write/update/delete only under {user_id}/...
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users upload own avatars"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own avatars"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Design images: public read; owners write under {user_id}/...
create policy "Design images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'design-images');

create policy "Users upload own design images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'design-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own design images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'design-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'design-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own design images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'design-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
