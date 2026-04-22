/*
  migration: auto painel multitenant core schema + rls
  purpose: dealerships, profiles, vehicles, leads with strict tenant isolation
  notes:
    - public vitrine reads use rpc functions keyed by dealership slug (rls cannot read browser url)
    - bootstrap the first profile per user via supabase dashboard or a trusted edge function (service role)
*/

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- tables
-- ---------------------------------------------------------------------------

create table public.dealerships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  custom_domain text,
  logo_url text,
  theme_settings jsonb not null default '{}'::jsonb,
  whatsapp_number text,
  contact_email text,
  constraint dealerships_slug_key unique (slug),
  constraint dealerships_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  )
);

comment on table public.dealerships is 'tenant root; one row per dealership (concessionaria).';

create unique index dealerships_custom_domain_lower_idx
  on public.dealerships (lower(custom_domain))
  where custom_domain is not null and length(trim(custom_domain)) > 0;

create table public.profiles (
  id uuid not null primary key references auth.users (id) on delete cascade,
  dealership_id uuid not null references public.dealerships (id) on delete restrict,
  role text not null,
  constraint profiles_role_check check (role in ('admin', 'seller'))
);

comment on table public.profiles is 'application user bound to a single dealership; mirrors auth.users.';

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  brand text not null,
  model text not null,
  manufacturing_year integer not null,
  model_year integer not null,
  mileage integer not null,
  price numeric(14, 2) not null,
  images text[] not null default '{}'::text[],
  description text,
  status text not null,
  constraint vehicles_status_check check (status in ('available', 'sold')),
  constraint vehicles_years_reasonable check (
    manufacturing_year between 1900 and 2100
    and model_year between 1900 and 2100
  ),
  constraint vehicles_mileage_non_negative check (mileage >= 0),
  constraint vehicles_price_non_negative check (price >= 0)
);

comment on table public.vehicles is 'inventory listing scoped to a dealership.';

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  client_name text not null,
  phone text not null,
  type text not null,
  simulation_data jsonb not null default '{}'::jsonb,
  constraint leads_type_check check (type in ('contact', 'simulation'))
);

comment on table public.leads is 'inbound lead tied to a vehicle and tenant.';

-- ---------------------------------------------------------------------------
-- indexes (rls + fk performance)
-- ---------------------------------------------------------------------------

create index profiles_dealership_id_idx on public.profiles (dealership_id);

create index vehicles_dealership_id_idx on public.vehicles (dealership_id);
create index vehicles_dealership_id_status_idx on public.vehicles (dealership_id, status);

create index leads_dealership_id_idx on public.leads (dealership_id);
create index leads_vehicle_id_idx on public.leads (vehicle_id);

-- ---------------------------------------------------------------------------
-- public read by dealership slug (security definer; no cross-tenant leakage)
-- ---------------------------------------------------------------------------

create or replace function public.get_dealership_public_by_slug(p_slug text)
returns setof public.dealerships
language sql
stable
security definer
set search_path = ''
as $$
  select d.*
  from public.dealerships as d
  where d.slug = p_slug
  limit 1;
$$;

comment on function public.get_dealership_public_by_slug(text) is
  'public storefront: load dealership row by slug; bypasses rls safely inside function.';

create or replace function public.list_public_vehicles_for_dealership_slug(p_slug text)
returns setof public.vehicles
language sql
stable
security definer
set search_path = ''
as $$
  select v.*
  from public.vehicles as v
  inner join public.dealerships as d on d.id = v.dealership_id
  where d.slug = p_slug
    and v.status = 'available';
$$;

comment on function public.list_public_vehicles_for_dealership_slug(text) is
  'public vitrine: available vehicles for a single dealership identified by slug.';

revoke all on function public.get_dealership_public_by_slug(text) from public;
revoke all on function public.list_public_vehicles_for_dealership_slug(text) from public;

grant execute on function public.get_dealership_public_by_slug(text) to anon, authenticated;
grant execute on function public.list_public_vehicles_for_dealership_slug(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- row level security
-- ---------------------------------------------------------------------------

alter table public.dealerships enable row level security;
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.leads enable row level security;

-- dealerships: authenticated users see only their tenant; only admins may update
create policy "dealerships_select_authenticated_same_tenant"
on public.dealerships
for select
to authenticated
using (
  id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

create policy "dealerships_update_authenticated_admin_same_tenant"
on public.dealerships
for update
to authenticated
using (
  id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
)
with check (
  id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

-- profiles: same-tenant visibility; updates split (self vs admin)
create policy "profiles_select_authenticated_same_tenant"
on public.profiles
for select
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

create policy "profiles_update_authenticated_self"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

create policy "profiles_update_authenticated_admin_peers"
on public.profiles
for update
to authenticated
using (
  (select pr.role from public.profiles as pr where pr.id = (select auth.uid())) = 'admin'
  and dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
  and id <> (select auth.uid())
)
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

-- vehicles: full crud inside tenant for authenticated sellers/admins (no public table access)
create policy "vehicles_select_authenticated_same_tenant"
on public.vehicles
for select
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

create policy "vehicles_insert_authenticated_same_tenant"
on public.vehicles
for insert
to authenticated
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

create policy "vehicles_update_authenticated_same_tenant"
on public.vehicles
for update
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
)
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

create policy "vehicles_delete_authenticated_same_tenant"
on public.vehicles
for delete
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

-- leads: tenant isolation; anonymous inserts only for available inventory rows
create policy "leads_select_authenticated_same_tenant"
on public.leads
for select
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

create policy "leads_insert_authenticated_same_tenant"
on public.leads
for insert
to authenticated
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
  and exists (
    select 1
    from public.vehicles as v
    where v.id = vehicle_id
      and v.dealership_id = leads.dealership_id
  )
);

create policy "leads_insert_anon_for_available_vehicle"
on public.leads
for insert
to anon
with check (
  exists (
    select 1
    from public.vehicles as v
    where v.id = leads.vehicle_id
      and v.dealership_id = leads.dealership_id
      and v.status = 'available'
  )
);

create policy "leads_update_authenticated_same_tenant"
on public.leads
for update
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
)
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

create policy "leads_delete_authenticated_same_tenant"
on public.leads
for delete
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- api privileges (rest/postgrest); rls still applies
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select, update on public.dealerships to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.vehicles to authenticated;
grant select, insert, update, delete on public.leads to authenticated;

grant insert on public.leads to anon;
