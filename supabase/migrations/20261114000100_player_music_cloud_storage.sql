-- Private cloud library for user-owned audio files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'player-music',
  'player-music',
  false,
  104857600,
  array['audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/x-wav','audio/flac','audio/webm','application/octet-stream']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own Player Music files" on storage.objects;
create policy "Users can read their own Player Music files"
on storage.objects for select to authenticated
using (bucket_id = 'player-music' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload their own Player Music files" on storage.objects;
create policy "Users can upload their own Player Music files"
on storage.objects for insert to authenticated
with check (bucket_id = 'player-music' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own Player Music files" on storage.objects;
create policy "Users can delete their own Player Music files"
on storage.objects for delete to authenticated
using (bucket_id = 'player-music' and (storage.foldername(name))[1] = auth.uid()::text);
