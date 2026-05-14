/*
  migration: enrich vehicles catalog with type/fipe/featured/active controls and keep public visibility limited to active inventory
  affected: public.vehicles, public.list_public_vehicles_filtered, public.get_public_vehicle_by_slug, private/public.get_public_vehicle_by_id
*/

alter table public.vehicles
  add column if not exists vehicle_type text not null default 'automovel';

alter table public.vehicles
  add column if not exists vehicle_type_custom text;

alter table public.vehicles
  add column if not exists fipe_price numeric(14, 2);

alter table public.vehicles
  add column if not exists sale_price numeric(14, 2);

alter table public.vehicles
  add column if not exists is_featured boolean not null default false;

alter table public.vehicles
  add column if not exists is_active boolean not null default true;

alter table public.vehicles
  drop constraint if exists vehicles_vehicle_type_check;

alter table public.vehicles
  add constraint vehicles_vehicle_type_check check (
    vehicle_type in (
      'automovel',
      'motocicleta',
      'caminhonete',
      'van',
      'suv',
      'utilitario',
      'caminhao',
      'outro'
    )
  );

alter table public.vehicles
  drop constraint if exists vehicles_vehicle_type_custom_required_check;

alter table public.vehicles
  add constraint vehicles_vehicle_type_custom_required_check check (
    vehicle_type <> 'outro'
    or (
      vehicle_type_custom is not null
      and length(trim(vehicle_type_custom)) > 0
    )
  );

alter table public.vehicles
  drop constraint if exists vehicles_fipe_price_non_negative_check;

alter table public.vehicles
  add constraint vehicles_fipe_price_non_negative_check check (
    fipe_price is null or fipe_price >= 0
  );

alter table public.vehicles
  drop constraint if exists vehicles_sale_price_non_negative_check;

alter table public.vehicles
  add constraint vehicles_sale_price_non_negative_check check (
    sale_price is null or sale_price >= 0
  );

update public.vehicles
set sale_price = price
where sale_price is null;

alter table public.vehicles
  alter column sale_price set not null;

create index if not exists vehicles_dealership_active_status_idx
  on public.vehicles (dealership_id, is_active, status);

create index if not exists vehicles_dealership_type_idx
  on public.vehicles (dealership_id, vehicle_type);

comment on column public.vehicles.vehicle_type is
  'Catalog type used for filter/grouping in panel and storefront.';

comment on column public.vehicles.vehicle_type_custom is
  'Required label when vehicle_type = outro.';

comment on column public.vehicles.fipe_price is
  'Market reference price (Tabela FIPE).';

comment on column public.vehicles.sale_price is
  'Public sale price used by storefront and panel.';

comment on column public.vehicles.is_featured is
  'Future merchandising flag for featured cards/badges.';

comment on column public.vehicles.is_active is
  'Operational availability switch. Inactive vehicles are hidden from public storefront.';

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
    and v.is_active = true
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
    and (p_min_price is null or coalesce(v.sale_price, v.price) >= p_min_price)
    and (p_max_price is null or coalesce(v.sale_price, v.price) <= p_max_price)
    and (p_min_year is null or v.model_year >= p_min_year)
    and (p_max_year is null or v.model_year <= p_max_year)
  order by v.created_at desc;
$$;

create or replace function public.get_public_vehicle_by_slug(
  p_dealership_id uuid,
  p_public_slug text
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
  where v.dealership_id = p_dealership_id
    and v.public_slug = lower(trim(p_public_slug))
    and v.status = 'available'
    and v.is_active = true
    and d.status = 'active'
  limit 1;
$$;

create or replace function private.get_public_vehicle_by_id_impl(
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
  where v.id = p_vehicle_id
    and v.dealership_id = p_dealership_id
    and v.status = 'available'
    and v.is_active = true
  limit 1;
$$;
