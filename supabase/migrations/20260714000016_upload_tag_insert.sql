-- Allow creators to add new tag labels during upload (slug uniqueness still enforced).
create policy "Authenticated users insert tags"
  on public.tags for insert
  to authenticated
  with check (true);
