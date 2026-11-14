-- Library list backup stored on the user's account (metadata only, no audio).
create table if not exists public.library_backups (
  user_id uuid primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.library_backups to authenticated;
grant all on public.library_backups to service_role;

alter table public.library_backups enable row level security;

create policy "own backup read" on public.library_backups for select to authenticated
  using (user_id = auth.uid());
create policy "own backup insert" on public.library_backups for insert to authenticated
  with check (user_id = auth.uid());
create policy "own backup update" on public.library_backups for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own backup delete" on public.library_backups for delete to authenticated
  using (user_id = auth.uid());

create trigger trg_library_backups_updated_at before update on public.library_backups
  for each row execute function public.touch_updated_at();
