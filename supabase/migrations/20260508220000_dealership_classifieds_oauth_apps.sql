/*
  migration: per-dealership OAuth app credentials for classifieds (OLX / WebMotors)
  purpose:
    - store client_id + encrypted client_secret per dealership and provider
    - edge functions / service-role paths exchange codes using these secrets
    - jwt tenants cannot read or write rows (same posture as dealership_classifieds_credentials)
  affected: public.dealership_classifieds_oauth_apps
*/

-- ---------------------------------------------------------------------------
-- oauth app registration per tenant (secrets at rest encrypted by app workers)
-- ---------------------------------------------------------------------------

create table if not exists public.dealership_classifieds_oauth_apps (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  provider text not null check (provider in ('olx', 'webmotors')),
  oauth_client_id text not null,
  oauth_client_secret_encrypted text not null,
  authorization_url_override text,
  token_url_override text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dealership_classifieds_oauth_apps_unique unique (dealership_id, provider)
);

comment on table public.dealership_classifieds_oauth_apps is
  'OAuth2 application id and encrypted client secret per dealership for OLX/WebMotors; workers read with service role.';

comment on column public.dealership_classifieds_oauth_apps.authorization_url_override is
  'Optional: overrides platform default OLX/WebMotors authorization URL when the partner program uses a custom endpoint.';

comment on column public.dealership_classifieds_oauth_apps.token_url_override is
  'Optional: overrides platform default token URL for the provider.';

create index if not exists dealership_classifieds_oauth_apps_dealership_idx
  on public.dealership_classifieds_oauth_apps (dealership_id, provider);

-- ---------------------------------------------------------------------------
-- updated_at trigger (reuses public.set_updated_at_timestamp)
-- ---------------------------------------------------------------------------

drop trigger if exists trg_dealership_classifieds_oauth_apps_updated_at
  on public.dealership_classifieds_oauth_apps;
create trigger trg_dealership_classifieds_oauth_apps_updated_at
before update on public.dealership_classifieds_oauth_apps
for each row
execute function public.set_updated_at_timestamp();

-- ---------------------------------------------------------------------------
-- rls: no direct access for anon/authenticated (service_role bypasses rls)
-- ---------------------------------------------------------------------------

alter table public.dealership_classifieds_oauth_apps enable row level security;

create policy "dealership_classifieds_oauth_apps_deny_anon_authenticated_select"
on public.dealership_classifieds_oauth_apps
for select
to anon, authenticated
using (false);

create policy "dealership_classifieds_oauth_apps_deny_anon_authenticated_insert"
on public.dealership_classifieds_oauth_apps
for insert
to anon, authenticated
with check (false);

create policy "dealership_classifieds_oauth_apps_deny_anon_authenticated_update"
on public.dealership_classifieds_oauth_apps
for update
to anon, authenticated
using (false)
with check (false);

create policy "dealership_classifieds_oauth_apps_deny_anon_authenticated_delete"
on public.dealership_classifieds_oauth_apps
for delete
to anon, authenticated
using (false);
