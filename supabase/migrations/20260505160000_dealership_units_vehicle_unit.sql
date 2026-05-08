/*
  migration: physical dealership units + vehicle assignment per unit
  purpose:
    - model branches/unidades under one dealership (shared branding online)
    - scope inventory rows to a unit while public vitrine keeps listing all tenant vehicles
  affected: public.dealership_units (new), public.vehicles.dealership_unit_id
*/

-- ---------------------------------------------------------------------------
-- dealership_units: named branches with structured address (JSON)
-- ---------------------------------------------------------------------------

create table public.dealership_units (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  name text not null,
  address jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.dealership_units is
  'Branches/unidades of a dealership; inventory can be scoped per unit while storefront branding stays tenant-wide.';

create index dealership_units_dealership_id_idx
  on public.dealership_units (dealership_id);

create index dealership_units_dealership_sort_idx
  on public.dealership_units (dealership_id, sort_order);

alter table public.dealership_units enable row level security;

-- Authenticated tenant users may list units for dropdowns (inventory assignment).
create policy "dealership_units_select_authenticated_same_tenant"
on public.dealership_units
for select
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

grant select on table public.dealership_units to authenticated;

-- ---------------------------------------------------------------------------
-- seed default unit per dealership before attaching vehicles
-- ---------------------------------------------------------------------------

insert into public.dealership_units (dealership_id, name, sort_order, address)
select d.id, 'Matriz', 0, '{}'::jsonb
from public.dealerships as d;

-- ---------------------------------------------------------------------------
-- vehicles: tie each row to exactly one unit within the same dealership
-- ---------------------------------------------------------------------------

alter table public.vehicles
  add column if not exists dealership_unit_id uuid references public.dealership_units (id) on delete restrict;

comment on column public.vehicles.dealership_unit_id is
  'Inventory branch; must belong to the same dealership_id row.';

create index vehicles_dealership_unit_id_idx
  on public.vehicles (dealership_unit_id);

update public.vehicles as v
set dealership_unit_id = (
  select du.id
  from public.dealership_units as du
  where du.dealership_id = v.dealership_id
  order by du.sort_order asc, du.created_at asc
  limit 1
)
where v.dealership_unit_id is null;

alter table public.vehicles
  alter column dealership_unit_id set not null;

-- ---------------------------------------------------------------------------
-- enforce dealership_unit belongs to vehicles.dealership_id
-- ---------------------------------------------------------------------------

create or replace function public.check_vehicle_unit_matches_dealership()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  unit_dealer uuid;
begin
  select du.dealership_id
  into unit_dealer
  from public.dealership_units as du
  where du.id = new.dealership_unit_id;

  if unit_dealer is null then
    raise exception 'dealership_unit_id does not reference a valid unit';
  end if;

  if unit_dealer is distinct from new.dealership_id then
    raise exception 'dealership_unit_id must belong to the same dealership_id';
  end if;

  return new;
end;
$$;

drop trigger if exists vehicles_unit_matches_dealership_trigger on public.vehicles;

create trigger vehicles_unit_matches_dealership_trigger
before insert or update of dealership_unit_id, dealership_id on public.vehicles
for each row
execute function public.check_vehicle_unit_matches_dealership();

-- ---------------------------------------------------------------------------
-- timestamps on units (pattern aligned with dealerships)
-- ---------------------------------------------------------------------------

create or replace function public.dealership_units_set_updated_at()
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

drop trigger if exists dealership_units_set_updated_at_trigger on public.dealership_units;

create trigger dealership_units_set_updated_at_trigger
before update on public.dealership_units
for each row
execute function public.dealership_units_set_updated_at();
