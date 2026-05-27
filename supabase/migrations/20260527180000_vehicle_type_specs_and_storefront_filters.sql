/*
  migration: type-specific vehicle specs (motos, caminhões, vans, ônibus) + storefront filter RPC
  affected: public.vehicles, public.list_public_vehicles_filtered
*/

-- ---------------------------------------------------------------------------
-- expand vehicle_type enum (add onibus)
-- ---------------------------------------------------------------------------

alter table public.vehicles drop constraint if exists vehicles_vehicle_type_check;

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
      'onibus',
      'outro'
    )
  );

-- ---------------------------------------------------------------------------
-- type-specific technical columns (nullable; used by form + vitrine filters)
-- ---------------------------------------------------------------------------

alter table public.vehicles
  add column if not exists gear_count integer;

alter table public.vehicles
  add column if not exists displacement_cc integer;

alter table public.vehicles
  add column if not exists engine_type text;

alter table public.vehicles
  add column if not exists cooling_type text;

alter table public.vehicles
  add column if not exists motorcycle_style text;

alter table public.vehicles
  add column if not exists starter_type text;

alter table public.vehicles
  add column if not exists brake_front text;

alter table public.vehicles
  add column if not exists brake_rear text;

alter table public.vehicles
  add column if not exists fuel_system text;

alter table public.vehicles
  add column if not exists traction text;

alter table public.vehicles
  add column if not exists axle_count integer;

alter table public.vehicles
  add column if not exists gross_weight_kg integer;

alter table public.vehicles
  add column if not exists passenger_capacity integer;

alter table public.vehicles
  add column if not exists cab_type text;

alter table public.vehicles
  add column if not exists body_truck_type text;

alter table public.vehicles
  drop constraint if exists vehicles_gear_count_check;

alter table public.vehicles
  add constraint vehicles_gear_count_check check (
    gear_count is null or (gear_count >= 1 and gear_count <= 18)
  );

alter table public.vehicles
  drop constraint if exists vehicles_displacement_cc_check;

alter table public.vehicles
  add constraint vehicles_displacement_cc_check check (
    displacement_cc is null or displacement_cc > 0
  );

alter table public.vehicles
  drop constraint if exists vehicles_axle_count_check;

alter table public.vehicles
  add constraint vehicles_axle_count_check check (
    axle_count is null or (axle_count >= 2 and axle_count <= 10)
  );

alter table public.vehicles
  drop constraint if exists vehicles_gross_weight_kg_check;

alter table public.vehicles
  add constraint vehicles_gross_weight_kg_check check (
    gross_weight_kg is null or gross_weight_kg > 0
  );

alter table public.vehicles
  drop constraint if exists vehicles_passenger_capacity_check;

alter table public.vehicles
  add constraint vehicles_passenger_capacity_check check (
    passenger_capacity is null or passenger_capacity > 0
  );

comment on column public.vehicles.gear_count is 'Number of gears (motos, some utilitários).';
comment on column public.vehicles.displacement_cc is 'Engine displacement in cubic centimeters.';
comment on column public.vehicles.engine_type is 'Engine cycle/type label (e.g. 4 tempos, elétrico).';
comment on column public.vehicles.cooling_type is 'Cooling system (ar, líquido).';
comment on column public.vehicles.motorcycle_style is 'Motorcycle segment (street, sport, trail, etc.).';
comment on column public.vehicles.starter_type is 'Starter type (elétrica, pedal).';
comment on column public.vehicles.brake_front is 'Front brake type (disco, tambor).';
comment on column public.vehicles.brake_rear is 'Rear brake type (disco, tambor).';
comment on column public.vehicles.fuel_system is 'Fuel delivery (injeção eletrônica, carburador).';
comment on column public.vehicles.traction is 'Drive/traction layout (4x2, 4x4, 6x2, etc.).';
comment on column public.vehicles.axle_count is 'Axle count for trucks/buses.';
comment on column public.vehicles.gross_weight_kg is 'Gross vehicle weight in kg.';
comment on column public.vehicles.passenger_capacity is 'Seated passenger capacity (van/ônibus).';
comment on column public.vehicles.cab_type is 'Truck cab type (simples, leito, etc.).';
comment on column public.vehicles.body_truck_type is 'Truck body/bed type (baú, graneleiro, etc.).';

create index if not exists vehicles_dealership_fuel_type_idx
  on public.vehicles (dealership_id, fuel_type)
  where fuel_type is not null;

create index if not exists vehicles_dealership_transmission_idx
  on public.vehicles (dealership_id, transmission)
  where transmission is not null;

create index if not exists vehicles_dealership_displacement_idx
  on public.vehicles (dealership_id, displacement_cc)
  where displacement_cc is not null;

-- ---------------------------------------------------------------------------
-- demo motos: enrich with WebMotors-style technical data
-- ---------------------------------------------------------------------------

update public.vehicles as v
set
  gear_count = coalesce(v.gear_count, 6),
  displacement_cc = coalesce(v.displacement_cc, 250),
  engine_type = coalesce(v.engine_type, '4 tempos'),
  cooling_type = coalesce(v.cooling_type, 'Ar'),
  motorcycle_style = coalesce(v.motorcycle_style, 'Street'),
  starter_type = coalesce(v.starter_type, 'Elétrica'),
  brake_front = coalesce(v.brake_front, 'Disco'),
  brake_rear = coalesce(v.brake_rear, 'Disco'),
  fuel_system = coalesce(v.fuel_system, 'Injeção eletrônica'),
  fuel_type = coalesce(v.fuel_type, 'Flex'),
  transmission = coalesce(v.transmission, 'Manual'),
  color = coalesce(v.color, 'Preto')
where v.vehicle_type = 'motocicleta'
  and v.public_slug like 'demo-%';

-- ---------------------------------------------------------------------------
-- RPC: extended storefront filters
-- ---------------------------------------------------------------------------

drop function if exists public.list_public_vehicles_filtered(uuid, text, text, numeric, numeric, integer, integer, text, integer, integer);

create or replace function public.list_public_vehicles_filtered(
  p_dealership_id uuid,
  p_brand text default null,
  p_model text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_min_year integer default null,
  p_max_year integer default null,
  p_vehicle_type text default null,
  p_min_mileage integer default null,
  p_max_mileage integer default null,
  p_fuel_type text default null,
  p_transmission text default null,
  p_color text default null,
  p_min_displacement_cc integer default null,
  p_max_displacement_cc integer default null,
  p_gear_count integer default null
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
      or v.brand ilike trim(p_brand)
    )
    and (
      p_model is null
      or trim(p_model) = ''
      or v.model ilike trim(p_model)
    )
    and (p_min_price is null or coalesce(v.sale_price, v.price) >= p_min_price)
    and (p_max_price is null or coalesce(v.sale_price, v.price) <= p_max_price)
    and (p_min_year is null or v.model_year >= p_min_year)
    and (p_max_year is null or v.model_year <= p_max_year)
    and (
      p_vehicle_type is null
      or trim(p_vehicle_type) = ''
      or v.vehicle_type = trim(p_vehicle_type)
    )
    and (p_min_mileage is null or v.mileage >= p_min_mileage)
    and (p_max_mileage is null or v.mileage <= p_max_mileage)
    and (
      p_fuel_type is null
      or trim(p_fuel_type) = ''
      or v.fuel_type ilike trim(p_fuel_type)
    )
    and (
      p_transmission is null
      or trim(p_transmission) = ''
      or v.transmission ilike trim(p_transmission)
    )
    and (
      p_color is null
      or trim(p_color) = ''
      or v.color ilike trim(p_color)
    )
    and (p_min_displacement_cc is null or v.displacement_cc >= p_min_displacement_cc)
    and (p_max_displacement_cc is null or v.displacement_cc <= p_max_displacement_cc)
    and (p_gear_count is null or v.gear_count = p_gear_count)
  order by v.created_at desc;
$$;

comment on function public.list_public_vehicles_filtered(
  uuid, text, text, numeric, numeric, integer, integer, text, integer, integer, text, text, text, integer, integer, integer
) is 'Public storefront inventory with extended catalog filters.';

revoke all on function public.list_public_vehicles_filtered(
  uuid, text, text, numeric, numeric, integer, integer, text, integer, integer, text, text, text, integer, integer, integer
) from public;

grant execute on function public.list_public_vehicles_filtered(
  uuid, text, text, numeric, numeric, integer, integer, text, integer, integer, text, text, text, integer, integer, integer
) to anon, authenticated;
