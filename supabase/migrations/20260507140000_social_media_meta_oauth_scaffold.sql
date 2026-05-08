/*
  migration: social media kit (Meta) — oauth scaffold + publication job queue
  purpose:
    - enable social_media_kit catalog entry and bind to business + enterprise plans for QA
    - store non-sensitive meta connection metadata, encrypted tokens, oauth popup sessions
    - asynchronous social_publication_jobs queue (worker in follow-up)
    - strict rls: tenants never read ciphertext rows
    - rpc for safe disconnect (credential wipe) from authenticated users
*/

-- ---------------------------------------------------------------------------
-- module catalog update: social_media_kit
-- ---------------------------------------------------------------------------

update public.saas_modules
set
  display_name = 'Kit redes sociais (Meta)',
  description =
    'Autenticação Meta (Facebook Page + Instagram Business) e fila para publicações assíncronas.',
  sort_order = 45,
  is_active = true
where key = 'social_media_kit';

insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select pp.id, sm.id
from public.pricing_plans as pp
inner join public.saas_modules as sm
  on sm.key = 'social_media_kit'
where pp.slug in ('business', 'enterprise')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- meta connection metadata (non-sensitive)
-- ---------------------------------------------------------------------------

create table if not exists public.dealership_meta_connections (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  status text not null check (
    status in (
      'disconnected',
      'connecting',
      'connected',
      'error',
      'reauth_required'
    )
  ) default 'disconnected',
  page_id text,
  page_name text,
  instagram_business_account_id text,
  instagram_username text,
  token_expires_at timestamptz,
  connected_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dealership_meta_connections_dealership_id_key unique (dealership_id)
);

comment on table public.dealership_meta_connections is
  'Dealership-linked Meta surfaces (Facebook Page + optional Instagram Business) without plaintext tokens in this table.';

create index if not exists dealership_meta_connections_dealership_status_idx
  on public.dealership_meta_connections (dealership_id, status);

-- ---------------------------------------------------------------------------
-- encrypted meta tokens (service role / edge callbacks only via bypass)
-- ---------------------------------------------------------------------------

create table if not exists public.dealership_meta_credentials (
  connection_id uuid primary key references public.dealership_meta_connections (id) on delete cascade,
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  user_access_token_encrypted text not null,
  page_access_token_encrypted text not null,
  scope text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.dealership_meta_credentials is
  'AES-GCM ciphertext for Meta long-lived user token and derived page access token.';

create index if not exists dealership_meta_credentials_dealership_idx
  on public.dealership_meta_credentials (dealership_id);

-- ---------------------------------------------------------------------------
-- oauth popup sessions (state validation)
-- ---------------------------------------------------------------------------

create table if not exists public.dealership_meta_oauth_sessions (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  state text not null unique,
  redirect_origin text not null,
  status text not null check (status in ('pending', 'consumed', 'expired', 'error')) default 'pending',
  error_reason text,
  consumed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table public.dealership_meta_oauth_sessions is
  'Short-lived Meta OAuth dialog sessions; binds Facebook redirect state to dealership and opener origin.';

create index if not exists dealership_meta_oauth_sessions_lookup_idx
  on public.dealership_meta_oauth_sessions (state, status, expires_at);

create index if not exists dealership_meta_oauth_sessions_dealership_idx
  on public.dealership_meta_oauth_sessions (dealership_id, created_at desc);

-- ---------------------------------------------------------------------------
-- publication jobs (async worker consumes with service role)
-- ---------------------------------------------------------------------------

create table if not exists public.social_publication_jobs (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  channels text[] not null check (
    channels <@ array['instagram_feed', 'facebook_page']::text[]
    and cardinality(channels) > 0
  ),
  artifact_template text not null check (artifact_template in ('classic', 'performance', 'tech')),
  payload_snapshot jsonb not null default '{}'::jsonb,
  step_payload jsonb,
  status text not null check (
    status in (
      'queued',
      'rendering',
      'uploading_meta',
      'published',
      'failed',
      'failed_partial'
    )
  ) default 'queued',
  attempt_count integer not null default 0,
  next_retry_at timestamptz,
  error_channel text,
  error_detail text,
  result_payload jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.social_publication_jobs is
  'Queued render + Meta Graph publishing tasks; worker updates statuses outside tenant JWT policies.';

create index if not exists social_publication_jobs_queue_idx
  on public.social_publication_jobs (status, next_retry_at, created_at);

create index if not exists social_publication_jobs_dealership_idx
  on public.social_publication_jobs (dealership_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists trg_dealership_meta_connections_updated_at
  on public.dealership_meta_connections;
create trigger trg_dealership_meta_connections_updated_at
before update on public.dealership_meta_connections
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_dealership_meta_credentials_updated_at
  on public.dealership_meta_credentials;
create trigger trg_dealership_meta_credentials_updated_at
before update on public.dealership_meta_credentials
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_social_publication_jobs_updated_at
  on public.social_publication_jobs;
create trigger trg_social_publication_jobs_updated_at
before update on public.social_publication_jobs
for each row
execute function public.set_updated_at_timestamp();

-- ---------------------------------------------------------------------------
-- rls
-- ---------------------------------------------------------------------------

alter table public.dealership_meta_connections enable row level security;
alter table public.dealership_meta_credentials enable row level security;
alter table public.dealership_meta_oauth_sessions enable row level security;
alter table public.social_publication_jobs enable row level security;

create policy "meta_connections_select_own"
on public.dealership_meta_connections
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_meta_connections.dealership_id
  )
);

create policy "meta_connections_insert_own"
on public.dealership_meta_connections
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_meta_connections.dealership_id
  )
);

create policy "meta_connections_update_own"
on public.dealership_meta_connections
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_meta_connections.dealership_id
  )
)
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_meta_connections.dealership_id
  )
);

create policy "meta_oauth_sessions_select_own"
on public.dealership_meta_oauth_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_meta_oauth_sessions.dealership_id
  )
);

create policy "meta_oauth_sessions_insert_own"
on public.dealership_meta_oauth_sessions
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_meta_oauth_sessions.dealership_id
  )
);

create policy "meta_oauth_sessions_update_own"
on public.dealership_meta_oauth_sessions
for update
to authenticated
using (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_meta_oauth_sessions.dealership_id
  )
)
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_meta_oauth_sessions.dealership_id
  )
);

create policy "social_publication_jobs_select_own"
on public.social_publication_jobs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = social_publication_jobs.dealership_id
  )
);

create policy "social_publication_jobs_insert_own"
on public.social_publication_jobs
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = social_publication_jobs.dealership_id
  )
);

-- credentials: no jwt policies — edge functions use service_role.

-- ---------------------------------------------------------------------------
-- disconnect: wipe ciphertext + reset metadata safely from tenant JWT
-- ---------------------------------------------------------------------------

create or replace function public.disconnect_dealership_meta_connection()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dealership_id uuid;
begin
  select p.dealership_id
    into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_dealership_id is null then
    raise exception 'Não autorizado.';
  end if;

  delete from public.dealership_meta_credentials as c
  using public.dealership_meta_connections as conn
  where c.connection_id = conn.id
    and conn.dealership_id = v_dealership_id;

  update public.dealership_meta_connections as conn
  set
    status = 'disconnected',
    page_id = null,
    page_name = null,
    instagram_business_account_id = null,
    instagram_username = null,
    token_expires_at = null,
    connected_at = null,
    last_error = null,
    updated_at = now()
  where conn.dealership_id = v_dealership_id;
end;
$$;

comment on function public.disconnect_dealership_meta_connection() is
  'Removes Meta ciphertext and clears connection metadata for the caller dealership; invoked from dealership-panel JWT.';

revoke all on function public.disconnect_dealership_meta_connection() from public;

grant execute on function public.disconnect_dealership_meta_connection() to authenticated;
