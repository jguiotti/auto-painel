-- migration: classifieds sync worker — listings tracking, enqueue RPC, auto-delist trigger
-- purpose: support async publish/delist jobs (Epic 2) with tenant-safe enqueue from JWT
-- affected: vehicle_classifieds_listings, classifieds_sync_jobs, vehicles trigger, RPCs

-- ---------------------------------------------------------------------------
-- published listing state per vehicle + provider
-- ---------------------------------------------------------------------------

create table if not exists public.vehicle_classifieds_listings (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  provider text not null check (provider in ('olx', 'webmotors')),
  external_listing_id text,
  sync_status text not null check (
    sync_status in ('pending', 'published', 'delisted', 'error')
  ) default 'pending',
  last_error text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicle_classifieds_listings_unique unique (vehicle_id, provider)
);

comment on table public.vehicle_classifieds_listings is
  'Tracks external classifieds listing ids and sync state per vehicle and provider (OLX / WebMotors).';

create index if not exists vehicle_classifieds_listings_dealership_idx
  on public.vehicle_classifieds_listings (dealership_id, provider);

drop trigger if exists trg_vehicle_classifieds_listings_updated_at
  on public.vehicle_classifieds_listings;
create trigger trg_vehicle_classifieds_listings_updated_at
before update on public.vehicle_classifieds_listings
for each row
execute function public.set_updated_at_timestamp();

alter table public.vehicle_classifieds_listings enable row level security;

create policy "vehicle_classifieds_listings_select_own"
on public.vehicle_classifieds_listings
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = vehicle_classifieds_listings.dealership_id
  )
);

-- ---------------------------------------------------------------------------
-- enqueue helper (service role + trigger + RPC)
-- ---------------------------------------------------------------------------

create or replace function private.enqueue_classifieds_sync_job_impl(
  p_dealership_id uuid,
  p_vehicle_id uuid,
  p_provider text,
  p_action text,
  p_payload jsonb default '{}'::jsonb,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job_id uuid;
begin
  if p_provider not in ('olx', 'webmotors') then
    raise exception 'invalid provider';
  end if;
  if p_action not in ('publish', 'delist') then
    raise exception 'invalid action';
  end if;

  if exists (
    select 1
    from public.classifieds_sync_jobs as j
    where j.dealership_id = p_dealership_id
      and j.vehicle_id = p_vehicle_id
      and j.provider = p_provider
      and j.action = p_action
      and j.status in ('queued', 'processing')
  ) then
    return null;
  end if;

  insert into public.classifieds_sync_jobs (
    dealership_id,
    vehicle_id,
    provider,
    action,
    status,
    payload,
    created_by
  )
  values (
    p_dealership_id,
    p_vehicle_id,
    p_provider,
    p_action,
    'queued',
    coalesce(p_payload, '{}'::jsonb),
    p_created_by
  )
  returning id into v_job_id;

  return v_job_id;
end;
$$;

comment on function private.enqueue_classifieds_sync_job_impl(uuid, uuid, text, text, jsonb, uuid) is
  'Inserts a classifieds sync job if none is queued/processing for the same vehicle, provider and action.';

revoke all on function private.enqueue_classifieds_sync_job_impl(uuid, uuid, text, text, jsonb, uuid) from public;
grant execute on function private.enqueue_classifieds_sync_job_impl(uuid, uuid, text, text, jsonb, uuid) to authenticated, service_role;

-- tenant-facing enqueue (publish/delist selected providers)
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
  'Enqueues publish/delist jobs for connected classifieds providers; tenant-scoped via profiles.dealership_id.';

revoke all on function public.enqueue_classifieds_sync_jobs(uuid, text, text[]) from public;
grant execute on function public.enqueue_classifieds_sync_jobs(uuid, text, text[]) to authenticated;

-- auto-delist when vehicle sold or deactivated
create or replace function private.enqueue_classifieds_delist_on_vehicle_change_impl()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider text;
  v_reason text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if old.status is not distinct from new.status
    and old.is_active is not distinct from new.is_active then
    return new;
  end if;

  if new.status = 'sold' then
    v_reason := 'sold';
  elsif new.is_active is false and coalesce(old.is_active, true) is true then
    v_reason := 'inactive';
  elsif new.status <> 'available' and old.status = 'available' then
    v_reason := 'status_change';
  else
    return new;
  end if;

  for v_provider in
    select c.provider
    from public.dealership_classifieds_connections as c
    where c.dealership_id = new.dealership_id
      and c.status = 'connected'
      and c.provider in ('olx', 'webmotors')
  loop
    perform private.enqueue_classifieds_sync_job_impl(
      new.dealership_id,
      new.id,
      v_provider,
      'delist',
      jsonb_build_object('reason', v_reason, 'source', 'vehicle_trigger'),
      null
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_vehicles_enqueue_classifieds_delist on public.vehicles;
create trigger trg_vehicles_enqueue_classifieds_delist
after update of status, is_active on public.vehicles
for each row
execute function private.enqueue_classifieds_delist_on_vehicle_change_impl();
