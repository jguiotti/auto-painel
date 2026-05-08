/*
  migration: classifieds oauth scaffold (olx + webmotors)
  purpose:
    - add secure connection metadata, encrypted credentials, oauth sessions and sync job queue
    - enforce tenant isolation via rls
    - seed classifieds_sync module and bind to business/enterprise plans
*/

-- ---------------------------------------------------------------------------
-- module catalog seed: classifieds_sync
-- ---------------------------------------------------------------------------

insert into public.saas_modules (key, display_name, description, sort_order, is_active)
values (
  'classifieds_sync',
  'Integração com classificados',
  'Conexão OAuth2 e sincronização de anúncios com OLX e WebMotors.',
  35,
  true
)
on conflict (key) do update
set
  display_name = excluded.display_name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select pp.id, sm.id
from public.pricing_plans as pp
inner join public.saas_modules as sm
  on sm.key = 'classifieds_sync'
where pp.slug in ('business', 'enterprise')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- connection metadata (non-sensitive)
-- ---------------------------------------------------------------------------

create table if not exists public.dealership_classifieds_connections (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  provider text not null check (provider in ('olx', 'webmotors')),
  status text not null check (
    status in (
      'disconnected',
      'connecting',
      'connected',
      'error',
      'reauth_required'
    )
  ) default 'disconnected',
  external_account_id text,
  token_expires_at timestamptz,
  last_sync_at timestamptz,
  connected_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dealership_classifieds_connections_unique unique (dealership_id, provider)
);

comment on table public.dealership_classifieds_connections is
  'Per-dealership connection status for classifieds providers (olx/webmotors), without storing plaintext tokens.';

create index if not exists dealership_classifieds_connections_dealership_idx
  on public.dealership_classifieds_connections (dealership_id, provider);

-- ---------------------------------------------------------------------------
-- encrypted credentials (sensitive)
-- ---------------------------------------------------------------------------

create table if not exists public.dealership_classifieds_credentials (
  connection_id uuid primary key references public.dealership_classifieds_connections (id) on delete cascade,
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  provider text not null check (provider in ('olx', 'webmotors')),
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  scope text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.dealership_classifieds_credentials is
  'Encrypted oauth access/refresh tokens per dealership and provider. Plaintext is never stored in postgres rows.';

create index if not exists dealership_classifieds_credentials_dealership_idx
  on public.dealership_classifieds_credentials (dealership_id, provider);

-- ---------------------------------------------------------------------------
-- oauth pending sessions for popup callback validation
-- ---------------------------------------------------------------------------

create table if not exists public.dealership_classifieds_oauth_sessions (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  provider text not null check (provider in ('olx', 'webmotors')),
  created_by uuid references auth.users (id) on delete set null,
  state text not null unique,
  code_verifier text,
  redirect_origin text not null,
  status text not null check (status in ('pending', 'consumed', 'expired', 'error')) default 'pending',
  error_reason text,
  consumed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table public.dealership_classifieds_oauth_sessions is
  'Short-lived oauth popup sessions used to validate callback state and bind tokens to the correct dealership.';

create index if not exists dealership_classifieds_oauth_sessions_lookup_idx
  on public.dealership_classifieds_oauth_sessions (state, status, expires_at);

create index if not exists dealership_classifieds_oauth_sessions_dealership_idx
  on public.dealership_classifieds_oauth_sessions (dealership_id, provider, created_at desc);

-- ---------------------------------------------------------------------------
-- sync queue (publish / delist)
-- ---------------------------------------------------------------------------

create table if not exists public.classifieds_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  provider text not null check (provider in ('olx', 'webmotors')),
  action text not null check (action in ('publish', 'delist')),
  status text not null check (status in ('queued', 'processing', 'succeeded', 'failed')) default 'queued',
  attempt_count integer not null default 0,
  next_retry_at timestamptz,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  result_payload jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.classifieds_sync_jobs is
  'Asynchronous publish/delist queue for classifieds providers with retry metadata.';

create index if not exists classifieds_sync_jobs_queue_idx
  on public.classifieds_sync_jobs (status, next_retry_at, created_at);

create index if not exists classifieds_sync_jobs_dealership_idx
  on public.classifieds_sync_jobs (dealership_id, provider, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_dealership_classifieds_connections_updated_at
  on public.dealership_classifieds_connections;
create trigger trg_dealership_classifieds_connections_updated_at
before update on public.dealership_classifieds_connections
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_dealership_classifieds_credentials_updated_at
  on public.dealership_classifieds_credentials;
create trigger trg_dealership_classifieds_credentials_updated_at
before update on public.dealership_classifieds_credentials
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_classifieds_sync_jobs_updated_at
  on public.classifieds_sync_jobs;
create trigger trg_classifieds_sync_jobs_updated_at
before update on public.classifieds_sync_jobs
for each row
execute function public.set_updated_at_timestamp();

-- ---------------------------------------------------------------------------
-- rls enablement
-- ---------------------------------------------------------------------------

alter table public.dealership_classifieds_connections enable row level security;
alter table public.dealership_classifieds_credentials enable row level security;
alter table public.dealership_classifieds_oauth_sessions enable row level security;
alter table public.classifieds_sync_jobs enable row level security;

-- connections: tenant can read/update only own dealership connection metadata
create policy "classifieds_connections_select_own"
on public.dealership_classifieds_connections
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_classifieds_connections.dealership_id
  )
);

create policy "classifieds_connections_insert_own"
on public.dealership_classifieds_connections
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_classifieds_connections.dealership_id
  )
);

create policy "classifieds_connections_update_own"
on public.dealership_classifieds_connections
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_classifieds_connections.dealership_id
  )
)
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_classifieds_connections.dealership_id
  )
);

-- oauth sessions: tenant can create/read pending sessions only for own dealership
create policy "classifieds_oauth_sessions_select_own"
on public.dealership_classifieds_oauth_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_classifieds_oauth_sessions.dealership_id
  )
);

create policy "classifieds_oauth_sessions_insert_own"
on public.dealership_classifieds_oauth_sessions
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_classifieds_oauth_sessions.dealership_id
  )
);

create policy "classifieds_oauth_sessions_update_own"
on public.dealership_classifieds_oauth_sessions
for update
to authenticated
using (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_classifieds_oauth_sessions.dealership_id
  )
)
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_classifieds_oauth_sessions.dealership_id
  )
);

-- sync jobs: tenant can read/insert jobs only for own dealership
create policy "classifieds_sync_jobs_select_own"
on public.classifieds_sync_jobs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = classifieds_sync_jobs.dealership_id
  )
);

create policy "classifieds_sync_jobs_insert_own"
on public.classifieds_sync_jobs
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = classifieds_sync_jobs.dealership_id
  )
);

-- credentials table intentionally has no tenant policies.
-- only service_role (edge functions / trusted backend) can read or mutate encrypted tokens.
