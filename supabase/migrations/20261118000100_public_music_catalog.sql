-- Catálogo público de músicas oficiais, com publicação restrita ao ADM.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('player-public-music', 'player-public-music', true, 104857600,
  array['audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/x-wav','audio/flac','audio/webm','application/octet-stream'])
on conflict (id) do update set public = true, file_size_limit = 104857600;

create table if not exists public.public_music (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null default 'Artista desconhecido',
  album text,
  duration numeric,
  storage_path text not null unique,
  mime_type text,
  file_size bigint not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.public_music enable row level security;
drop policy if exists "Anyone can read published music" on public.public_music;
create policy "Anyone can read published music" on public.public_music for select to anon, authenticated using (published = true);
drop policy if exists "Admins manage public music" on public.public_music;
create policy "Admins manage public music" on public.public_music for all to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Anyone can download official music" on storage.objects;
create policy "Anyone can download official music" on storage.objects for select to public using (bucket_id = 'player-public-music');
drop policy if exists "Admins upload official music" on storage.objects;
create policy "Admins upload official music" on storage.objects for insert to authenticated
with check (bucket_id = 'player-public-music' and public.has_role(auth.uid(), 'admin'));
drop policy if exists "Admins update official music" on storage.objects;
create policy "Admins update official music" on storage.objects for update to authenticated
using (bucket_id = 'player-public-music' and public.has_role(auth.uid(), 'admin'))
with check (bucket_id = 'player-public-music' and public.has_role(auth.uid(), 'admin'));
drop policy if exists "Admins delete official music" on storage.objects;
create policy "Admins delete official music" on storage.objects for delete to authenticated
using (bucket_id = 'player-public-music' and public.has_role(auth.uid(), 'admin'));
