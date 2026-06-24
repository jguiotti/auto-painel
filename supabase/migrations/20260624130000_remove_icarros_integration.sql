-- migration: remove iCarros integration (service discontinued by portal)
-- purpose: purge icarros data, deactivate saas module, restrict provider enum to olx/webmotors

-- ---------------------------------------------------------------------------
-- purge icarros rows (order respects FK dependencies)
-- ---------------------------------------------------------------------------

delete from public.classifieds_sync_jobs
where provider = 'icarros';

delete from public.vehicle_classifieds_listings
where provider = 'icarros';

delete from public.dealership_classifieds_integrator_accounts
where provider = 'icarros';

delete from public.dealership_classifieds_credentials as cred
using public.dealership_classifieds_connections as conn
where cred.connection_id = conn.id
  and conn.provider = 'icarros';

delete from public.dealership_classifieds_oauth_sessions
where provider = 'icarros';

delete from public.dealership_classifieds_oauth_apps
where provider = 'icarros';

delete from public.dealership_classifieds_connections
where provider = 'icarros';

delete from public.platform_classifieds_oauth_providers
where provider = 'icarros';

-- ---------------------------------------------------------------------------
-- deactivate icarros SaaS module and remove from plans
-- ---------------------------------------------------------------------------

delete from public.pricing_plan_modules as ppm
using public.saas_modules as sm
where ppm.module_id = sm.id
  and sm.key = 'icarros_sync';

update public.saas_modules
set
  is_active = false,
  description = 'Descontinuado — portal iCarros encerrou integração API (2026).'
where key = 'icarros_sync';

-- ---------------------------------------------------------------------------
-- provider check constraints — olx and webmotors only
-- ---------------------------------------------------------------------------

alter table public.dealership_classifieds_connections
  drop constraint if exists dealership_classifieds_connections_provider_check;
alter table public.dealership_classifieds_connections
  add constraint dealership_classifieds_connections_provider_check
  check (provider in ('olx', 'webmotors'));

alter table public.dealership_classifieds_credentials
  drop constraint if exists dealership_classifieds_credentials_provider_check;
alter table public.dealership_classifieds_credentials
  add constraint dealership_classifieds_credentials_provider_check
  check (provider in ('olx', 'webmotors'));

alter table public.dealership_classifieds_oauth_sessions
  drop constraint if exists dealership_classifieds_oauth_sessions_provider_check;
alter table public.dealership_classifieds_oauth_sessions
  add constraint dealership_classifieds_oauth_sessions_provider_check
  check (provider in ('olx', 'webmotors'));

alter table public.classifieds_sync_jobs
  drop constraint if exists classifieds_sync_jobs_provider_check;
alter table public.classifieds_sync_jobs
  add constraint classifieds_sync_jobs_provider_check
  check (provider in ('olx', 'webmotors'));

alter table public.vehicle_classifieds_listings
  drop constraint if exists vehicle_classifieds_listings_provider_check;
alter table public.vehicle_classifieds_listings
  add constraint vehicle_classifieds_listings_provider_check
  check (provider in ('olx', 'webmotors'));

alter table public.dealership_classifieds_oauth_apps
  drop constraint if exists dealership_classifieds_oauth_apps_provider_check;
alter table public.dealership_classifieds_oauth_apps
  add constraint dealership_classifieds_oauth_apps_provider_check
  check (provider in ('olx', 'webmotors'));

alter table public.platform_classifieds_oauth_providers
  drop constraint if exists platform_classifieds_oauth_providers_provider_check;
alter table public.platform_classifieds_oauth_providers
  add constraint platform_classifieds_oauth_providers_provider_check
  check (provider in ('olx', 'webmotors'));

alter table public.dealership_classifieds_integrator_accounts
  drop constraint if exists dealership_classifieds_integrator_accounts_provider_check;
alter table public.dealership_classifieds_integrator_accounts
  add constraint dealership_classifieds_integrator_accounts_provider_check
  check (provider in ('olx', 'webmotors'));

comment on table public.dealership_classifieds_connections is
  'Per-dealership connection status for classifieds providers (olx/webmotors), without storing plaintext tokens.';

comment on table public.vehicle_classifieds_listings is
  'Tracks external classifieds listing ids and sync state per vehicle and provider (OLX / WebMotors).';

-- ---------------------------------------------------------------------------
-- rpc: provider module mapping without icarros
-- ---------------------------------------------------------------------------

create or replace function private.classifieds_provider_module_key(p_provider text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_provider
    when 'olx' then 'olx_sync'
    when 'webmotors' then 'webmotors_sync'
    else null
  end;
$$;

create or replace function public.enqueue_classifieds_sync_jobs(
  p_vehicle_id uuid,
  p_action text,
  p_providers text[] default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dealership_id uuid;
  v_provider text;
  v_providers text[];
  v_enqueued integer := 0;
  v_job_id uuid;
  v_feature_keys text[];
  v_module_key text;
begin
  if p_action not in ('publish', 'delist') then
    raise exception 'invalid action';
  end if;

  select p.dealership_id
  into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_dealership_id is null then
    raise exception 'unauthorized';
  end if;

  if not exists (
    select 1
    from public.vehicles as v
    where v.id = p_vehicle_id
      and v.dealership_id = v_dealership_id
  ) then
    raise exception 'vehicle not found';
  end if;

  v_feature_keys := public.effective_feature_keys_for_active_dealership(v_dealership_id);

  v_providers := coalesce(
    p_providers,
    array(
      select c.provider
      from public.dealership_classifieds_connections as c
      where c.dealership_id = v_dealership_id
        and c.status = 'connected'
        and c.provider in ('olx', 'webmotors')
    )
  );

  if coalesce(array_length(v_providers, 1), 0) = 0 then
    return jsonb_build_object('enqueued', 0, 'message', 'no_connected_providers');
  end if;

  foreach v_provider in array v_providers
  loop
    if v_provider not in ('olx', 'webmotors') then
      continue;
    end if;

    v_module_key := private.classifieds_provider_module_key(v_provider);
    if v_module_key is null or not (v_module_key = any (v_feature_keys)) then
      continue;
    end if;

    if p_action = 'publish'
      and not exists (
        select 1
        from public.dealership_classifieds_connections as c
        where c.dealership_id = v_dealership_id
          and c.provider = v_provider
          and c.status = 'connected'
      )
    then
      continue;
    end if;

    if p_action = 'delist' and not exists (
      select 1
      from public.vehicle_classifieds_listings as l
      where l.vehicle_id = p_vehicle_id
        and l.provider = v_provider
        and l.sync_status = 'published'
    ) then
      continue;
    end if;

    v_job_id := private.enqueue_classifieds_sync_job_impl(
      v_dealership_id,
      p_vehicle_id,
      v_provider,
      p_action,
      jsonb_build_object('source', 'tenant_rpc'),
      (select auth.uid())
    );

    if v_job_id is not null then
      v_enqueued := v_enqueued + 1;
    end if;
  end loop;

  return jsonb_build_object('enqueued', v_enqueued);
end;
$$;

create or replace function private.disconnect_dealership_classifieds_connection_impl(p_provider text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dealership_id uuid;
begin
  if p_provider is null or p_provider not in ('olx', 'webmotors') then
    raise exception 'Provedor inválido.';
  end if;

  select p.dealership_id
    into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_dealership_id is null then
    raise exception 'Não autorizado.';
  end if;

  delete from public.dealership_classifieds_integrator_accounts as ia
  where ia.dealership_id = v_dealership_id
    and ia.provider = p_provider;

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

update public.pricing_plans
set
  description = 'Integrações OLX, WebMotors e kit Meta — faixa típica acima de 30 veículos.',
  updated_at = now()
where slug = 'enterprise';
