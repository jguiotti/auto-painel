/*
  migration: dealership lifecycle status, saas marketing prospects, active-tenant public RPCs
  purpose:
    - add public.dealerships.status (branding/domain already modeled on dealerships)
    - create public.saas_prospects for institutional marketing leads with RLS (insert-only for api roles)
    - ensure anon vitrine + anon vehicle leads only work for dealerships with status = active
  affected: public.dealerships, public.leads policies, public RPCs, new public.saas_prospects
*/

-- ---------------------------------------------------------------------------
-- dealerships: lifecycle status
-- ---------------------------------------------------------------------------

alter table public.dealerships
  add column if not exists status text;

update public.dealerships
set status = coalesce(nullif(trim(status), ''), 'active');

alter table public.dealerships
  alter column status set default 'active';

alter table public.dealerships
  alter column status set not null;

-- idempotent: dashboard re-runs or partial applies may leave the constraint in place
do $$
begin
  if not exists (
    select 1
    from pg_constraint as c
    inner join pg_class as rel on rel.oid = c.conrelid
    inner join pg_namespace as ns on ns.oid = rel.relnamespace
    where c.conname = 'dealerships_status_check'
      and ns.nspname = 'public'
      and rel.relname = 'dealerships'
  ) then
    alter table public.dealerships
      add constraint dealerships_status_check check (
        status in ('active', 'suspended', 'pending_setup', 'churned')
      );
  end if;
end;
$$;

comment on column public.dealerships.status is
  'tenant lifecycle; public storefront RPCs and anon lead capture require active.';

-- ---------------------------------------------------------------------------
-- saas_prospects: institutional / marketing site (AutoPainel SaaS)
-- ---------------------------------------------------------------------------

create table if not exists public.saas_prospects (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  company_name text,
  message text,
  source text not null default 'marketing_site',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint saas_prospects_full_name_trimmed check (length(trim(full_name)) >= 2),
  constraint saas_prospects_email_trimmed check (length(trim(email)) >= 3),
  constraint saas_prospects_email_format check (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

comment on table public.saas_prospects is
  'leads from AutoPainel marketing site; read with service role in admin-master (RLS blocks selects for anon/authenticated).';

create index if not exists saas_prospects_created_at_idx
  on public.saas_prospects (created_at desc);

-- ---------------------------------------------------------------------------
-- row level security: saas_prospects
-- ---------------------------------------------------------------------------

alter table public.saas_prospects enable row level security;

-- explicit with check (not constant true) so insert stays allowlisted without tripping security linters
drop policy if exists "saas_prospects_insert_anon_marketing" on public.saas_prospects;
drop policy if exists "saas_prospects_insert_authenticated_marketing" on public.saas_prospects;

create policy "saas_prospects_insert_anon_marketing"
on public.saas_prospects
for insert
to anon
with check (
  length(trim(full_name)) >= 2
  and length(trim(email)) >= 3
  and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  and metadata is not null
  and trim(source) in ('marketing_site')
  and (phone is null or length(trim(phone)) <= 40)
  and (company_name is null or length(trim(company_name)) <= 200)
  and (message is null or length(message) <= 10000)
);

create policy "saas_prospects_insert_authenticated_marketing"
on public.saas_prospects
for insert
to authenticated
with check (
  length(trim(full_name)) >= 2
  and length(trim(email)) >= 3
  and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  and metadata is not null
  and trim(source) in ('marketing_site')
  and (phone is null or length(trim(phone)) <= 40)
  and (company_name is null or length(trim(company_name)) <= 200)
  and (message is null or length(message) <= 10000)
);

-- ---------------------------------------------------------------------------
-- api grants (postgrest); no select granted — service role bypasses RLS for admin-master
-- ---------------------------------------------------------------------------

grant insert on public.saas_prospects to anon, authenticated;

-- ---------------------------------------------------------------------------
-- leads: anon inserts only when dealership is active
-- ---------------------------------------------------------------------------

drop policy if exists "leads_insert_anon_for_available_vehicle" on public.leads;

create policy "leads_insert_anon_for_available_vehicle"
on public.leads
for insert
to anon
with check (
  exists (
    select 1
    from public.vehicles as v
    inner join public.dealerships as d on d.id = v.dealership_id
    where v.id = leads.vehicle_id
      and v.dealership_id = leads.dealership_id
      and v.status = 'available'
      and d.status = 'active'
  )
);

-- ---------------------------------------------------------------------------
-- public RPCs: vitrine limited to active dealerships
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
    and d.status = 'active'
  limit 1;
$$;

create or replace function public.get_dealership_public_by_id(p_id uuid)
returns setof public.dealerships
language sql
stable
security definer
set search_path = ''
as $$
  select d.*
  from public.dealerships as d
  where d.id = p_id
    and d.status = 'active'
  limit 1;
$$;

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
    and d.status = 'active'
    and v.status = 'available';
$$;

create or replace function public.list_public_vehicles_filtered(
  p_dealership_id uuid,
  p_brand text default null,
  p_model text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_min_year integer default null,
  p_max_year integer default null
)
returns setof public.vehicles
language sql
stable
security definer
set search_path = ''
as $$
  select v.*
  from public.vehicles as v
  where v.dealership_id = p_dealership_id
    and v.status = 'available'
    and exists (
      select 1
      from public.dealerships as d
      where d.id = p_dealership_id
        and d.status = 'active'
    )
    and (
      p_brand is null
      or trim(p_brand) = ''
      or v.brand ilike '%' || trim(p_brand) || '%'
    )
    and (
      p_model is null
      or trim(p_model) = ''
      or v.model ilike '%' || trim(p_model) || '%'
    )
    and (p_min_price is null or v.price >= p_min_price)
    and (p_max_price is null or v.price <= p_max_price)
    and (p_min_year is null or v.model_year >= p_min_year)
    and (p_max_year is null or v.model_year <= p_max_year)
  order by v.created_at desc;
$$;

create or replace function public.get_public_vehicle_by_id(
  p_vehicle_id uuid,
  p_dealership_id uuid
)
returns setof public.vehicles
language sql
stable
security definer
set search_path = ''
as $$
  select v.*
  from public.vehicles as v
  inner join public.dealerships as d on d.id = v.dealership_id
  where v.id = p_vehicle_id
    and v.dealership_id = p_dealership_id
    and v.status = 'available'
    and d.status = 'active'
  limit 1;
$$;

create or replace function public.resolve_dealership_id_by_host(
  p_host text,
  p_platform_root_domain text
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_host text;
  v_root text;
  r_id uuid;
  v_subdomain_slug text;
begin
  if p_host is null or length(trim(p_host)) = 0 then
    return null;
  end if;

  v_host := lower(trim(regexp_replace(p_host, ':\\d+$', '')));
  if v_host like 'www.%' then
    v_host := substring(v_host from 5);
  end if;

  select d.id into r_id
  from public.dealerships as d
  where nullif(trim(d.custom_domain), '') is not null
    and lower(regexp_replace(trim(d.custom_domain), '^www\.', '')) = v_host
    and d.status = 'active'
  limit 1;

  if r_id is not null then
    return r_id;
  end if;

  if p_platform_root_domain is null or length(trim(p_platform_root_domain)) = 0 then
    return null;
  end if;

  v_root := lower(trim(regexp_replace(p_platform_root_domain, ':\\d+$', '')));

  if v_host = v_root then
    return null;
  end if;

  if not (v_host like '%.' || v_root) then
    return null;
  end if;

  v_subdomain_slug := split_part(v_host, '.', 1);

  select d.id into r_id
  from public.dealerships as d
  where d.slug = v_subdomain_slug
    and d.status = 'active'
  limit 1;

  return r_id;
end;
$$;
