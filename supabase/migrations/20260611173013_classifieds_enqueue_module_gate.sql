/*
  migration: gate classifieds enqueue RPC by per-portal SaaS module
  purpose:
    - only enqueue publish/delist when plan includes olx_sync / webmotors_sync / icarros_sync for that provider
  affected: public.enqueue_classifieds_sync_jobs
*/

create or replace function private.classifieds_provider_module_key(p_provider text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_provider
    when 'olx' then 'olx_sync'
    when 'webmotors' then 'webmotors_sync'
    when 'icarros' then 'icarros_sync'
    else null
  end;
$$;

comment on function private.classifieds_provider_module_key(text) is
  'Maps classifieds provider slug to saas_modules.key for plan gating.';

revoke all on function private.classifieds_provider_module_key(text) from public;
grant execute on function private.classifieds_provider_module_key(text) to authenticated, service_role;

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
        and c.provider in ('olx', 'webmotors', 'icarros')
    )
  );

  if coalesce(array_length(v_providers, 1), 0) = 0 then
    return jsonb_build_object('enqueued', 0, 'message', 'no_connected_providers');
  end if;

  foreach v_provider in array v_providers
  loop
    if v_provider not in ('olx', 'webmotors', 'icarros') then
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

comment on function public.enqueue_classifieds_sync_jobs(uuid, text, text[]) is
  'Enqueues publish/delist for connected providers when the matching portal module is on the dealership plan.';
