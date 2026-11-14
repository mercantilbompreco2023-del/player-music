
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles or admin read" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "admin grant roles" on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin revoke roles" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- profiles: only email + display name (needed for admin user list)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile or admin read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, left(coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 80));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- home cards
create table public.app_cards (
  id uuid primary key default gen_random_uuid(),
  function_key text not null check (function_key in ('descobrir','buscar','biblioteca','playlists','favoritos','fila','player','importar','configuracoes','admin')),
  title text not null check (char_length(title) between 1 and 40),
  description text not null default '' check (char_length(description) <= 120),
  icon text not null default 'music' check (char_length(icon) <= 30),
  position int not null default 0,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
grant select on public.app_cards to anon;
grant select, insert, update, delete on public.app_cards to authenticated;
grant all on public.app_cards to service_role;
alter table public.app_cards enable row level security;
create policy "public read enabled cards" on public.app_cards for select to anon, authenticated
  using (enabled or public.has_role(auth.uid(), 'admin'));
create policy "admin insert cards" on public.app_cards for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "admin update cards" on public.app_cards for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin delete cards" on public.app_cards for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- global settings
create table public.app_settings (
  key text primary key check (key in ('home_greeting','demo_tracks_enabled')),
  value jsonb not null,
  updated_at timestamptz not null default now()
);
grant select on public.app_settings to anon;
grant select, update on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy "public read settings" on public.app_settings for select to anon, authenticated using (true);
create policy "admin update settings" on public.app_settings for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- audit log (written only by triggers)
create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_email text,
  action text not null,
  target_table text not null,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);
grant select on public.admin_audit_log to authenticated;
grant all on public.admin_audit_log to service_role;
alter table public.admin_audit_log enable row level security;
create policy "admin read audit" on public.admin_audit_log for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.audit_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare rec jsonb; old_rec jsonb;
begin
  if tg_op = 'DELETE' then rec := to_jsonb(old); else rec := to_jsonb(new); end if;
  if tg_op = 'UPDATE' then old_rec := to_jsonb(old); end if;
  insert into public.admin_audit_log (actor_id, actor_email, action, target_table, target_id, details)
  values (auth.uid(), (select email from public.profiles where id = auth.uid()), lower(tg_op), tg_table_name,
          coalesce(rec->>'id', rec->>'key'), jsonb_build_object('new', case when tg_op <> 'DELETE' then rec end, 'old', case when tg_op = 'UPDATE' then old_rec when tg_op = 'DELETE' then rec end));
  return null;
end $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;

create trigger cards_touch before update on public.app_cards for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.app_settings for each row execute function public.touch_updated_at();
create trigger cards_audit after insert or update or delete on public.app_cards for each row execute function public.audit_change();
create trigger settings_audit after update on public.app_settings for each row execute function public.audit_change();
create trigger roles_audit after insert or delete on public.user_roles for each row
  when (auth.uid() is not null) execute function public.audit_change();

-- never remove the last admin
create or replace function public.protect_last_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'admin' and (select count(*) from public.user_roles where role = 'admin') <= 1 then
    raise exception 'Não é possível remover o último administrador.';
  end if;
  return old;
end $$;
create trigger roles_last_admin before delete on public.user_roles for each row execute function public.protect_last_admin();

insert into public.app_cards (function_key, title, description, icon, position) values
 ('descobrir','Descobrir','Recentes e faixas de demonstração','compass',1),
 ('player','Player','O que está tocando agora','disc',2),
 ('buscar','Buscar músicas','Encontre por título ou artista','search',3),
 ('biblioteca','Minha biblioteca','Todas as suas faixas','library',4),
 ('importar','Importar músicas','Adicione áudios do seu aparelho','upload',5),
 ('playlists','Playlists','Crie e organize listas','list-music',6),
 ('favoritos','Favoritos','Suas faixas marcadas com coração','heart',7),
 ('fila','Fila de reprodução','Veja e edite o que vem a seguir','list-ordered',8),
 ('configuracoes','Configurações','Tema, privacidade e limitações','settings',9),
 ('admin','Administração','Área restrita a administradores','shield',10);

insert into public.app_settings (key, value) values
 ('home_greeting', '"Sua música, do seu jeito."'),
 ('demo_tracks_enabled', 'true');
