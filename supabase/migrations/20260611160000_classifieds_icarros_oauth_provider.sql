/*
  migration: extend classifieds provider enum to icarros (OAuth + sync)
  purpose:
    - allow icarros rows in connections, credentials, sessions, jobs and listings
    - seed platform oauth row for icarros (disabled until ops configures)
    - extend disconnect RPC to icarros
  affected: classifieds tables, platform_classifieds_oauth_providers, disconnect RPC
*/

-- ---------------------------------------------------------------------------
-- widen provider check constraints (olx, webmotors → + icarros)
-- ---------------------------------------------------------------------------

alter table public.dealership_classifieds_connections
  drop constraint if exists dealership_classifieds_connections_provider_check;
alter table public.dealership_classifieds_connections
  add constraint dealership_classifieds_connections_provider_check
  check (provider in ('olx', 'webmotors', 'icarros'));

alter table public.dealership_classifieds_credentials
  drop constraint if exists dealership_classifieds_credentials_provider_check;
alter table public.dealership_classifieds_credentials
  add constraint dealership_classifieds_credentials_provider_check
  check (provider in ('olx', 'webmotors', 'icarros'));

alter table public.dealership_classifieds_oauth_sessions
  drop constraint if exists dealership_classifieds_oauth_sessions_provider_check;
alter table public.dealership_classifieds_oauth_sessions
  add constraint dealership_classifieds_oauth_sessions_provider_check
  check (provider in ('olx', 'webmotors', 'icarros'));

alter table public.classifieds_sync_jobs
  drop constraint if exists classifieds_sync_jobs_provider_check;
alter table public.classifieds_sync_jobs
  add constraint classifieds_sync_jobs_provider_check
  check (provider in ('olx', 'webmotors', 'icarros'));

alter table public.vehicle_classifieds_listings
  drop constraint if exists vehicle_classifieds_listings_provider_check;
alter table public.vehicle_classifieds_listings
  add constraint vehicle_classifieds_listings_provider_check
  check (provider in ('olx', 'webmotors', 'icarros'));

alter table public.dealership_classifieds_oauth_apps
  drop constraint if exists dealership_classifieds_oauth_apps_provider_check;
alter table public.dealership_classifieds_oauth_apps
  add constraint dealership_classifieds_oauth_apps_provider_check
  check (provider in ('olx', 'webmotors', 'icarros'));

-- platform table primary key is provider — recreate check via drop/add not needed for PK
alter table public.platform_classifieds_oauth_providers
  drop constraint if exists platform_classifieds_oauth_providers_provider_check;
alter table public.platform_classifieds_oauth_providers
  add constraint platform_classifieds_oauth_providers_provider_check
  check (provider in ('olx', 'webmotors', 'icarros'));

insert into public.platform_classifieds_oauth_providers (provider, is_enabled)
values ('icarros', false)
on conflict (provider) do nothing;

comment on table public.dealership_classifieds_connections is
  'Per-dealership connection status for classifieds providers (olx/webmotors/icarros), without storing plaintext tokens.';

comment on table public.vehicle_classifieds_listings is
  'Tracks external classifieds listing ids and sync state per vehicle and provider (OLX / WebMotors / iCarros).';

-- ---------------------------------------------------------------------------
-- disconnect RPC — include icarros
-- ---------------------------------------------------------------------------

create or replace function private.disconnect_dealership_classifieds_connection_impl(p_provider text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dealership_id uuid;
begin
  if p_provider is null or p_provider not in ('olx', 'webmotors', 'icarros') then
    raise exception 'Provedor inválido.';
  end if;

  select p.dealership_id
    into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_dealership_id is null then
    raise exception 'Não autorizado.';
  end if;

  delete from public.dealership_classifieds_credentials as cred
  using public.dealership_classifieds_connections as conn
  where cred.connection_id = conn.id
    and conn.dealership_id = v_dealership_id
    and conn.provider = p_provider;

  update public.dealership_classifieds_connections as conn
  set
    status = 'disconnected',
    token_expires_at = null,
    connected_at = null,
    last_error = null,
    updated_at = now()
  where conn.dealership_id = v_dealership_id
    and conn.provider = p_provider;
end;
$$;
