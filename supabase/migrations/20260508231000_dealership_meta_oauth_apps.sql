/*
  migration: per-dealership Meta (Facebook) developer app credentials
  purpose:
    - store App ID + encrypted App Secret per dealership (customer-owned Meta app)
    - platform env META_APP_* becomes optional fallback for development only
  affected: public.dealership_meta_oauth_apps
*/

create table if not exists public.dealership_meta_oauth_apps (
  dealership_id uuid primary key references public.dealerships (id) on delete cascade,
  meta_app_id text not null,
  meta_app_secret_encrypted text not null,
  graph_api_version_override text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.dealership_meta_oauth_apps is
  'Facebook Developer App ID and encrypted App Secret per dealership; AutoPainel does not use a single platform Meta app for production tenants.';

drop trigger if exists trg_dealership_meta_oauth_apps_updated_at
  on public.dealership_meta_oauth_apps;
create trigger trg_dealership_meta_oauth_apps_updated_at
before update on public.dealership_meta_oauth_apps
for each row
execute function public.set_updated_at_timestamp();

alter table public.dealership_meta_oauth_apps enable row level security;

create policy "dealership_meta_oauth_apps_deny_anon_authenticated_select"
on public.dealership_meta_oauth_apps
for select
to anon, authenticated
using (false);

create policy "dealership_meta_oauth_apps_deny_anon_authenticated_insert"
on public.dealership_meta_oauth_apps
for insert
to anon, authenticated
with check (false);

create policy "dealership_meta_oauth_apps_deny_anon_authenticated_update"
on public.dealership_meta_oauth_apps
for update
to anon, authenticated
using (false)
with check (false);

create policy "dealership_meta_oauth_apps_deny_anon_authenticated_delete"
on public.dealership_meta_oauth_apps
for delete
to anon, authenticated
using (false);
