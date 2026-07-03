-- ShowClutch — listing photos storage bucket + policies.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- Public bucket so photos display via public URLs.
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

-- Anyone can read listing photos.
drop policy if exists "listing photos read" on storage.objects;
create policy "listing photos read" on storage.objects
  for select using (bucket_id = 'listing-photos');

-- Logged-in users can upload, but only into their own {user_id}/ folder.
drop policy if exists "listing photos upload own folder" on storage.objects;
create policy "listing photos upload own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own uploads.
drop policy if exists "listing photos delete own" on storage.objects;
create policy "listing photos delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and owner = auth.uid());
