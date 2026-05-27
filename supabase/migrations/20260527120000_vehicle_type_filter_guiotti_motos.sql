/*
  migration: vehicle type filter on public listing RPC, guiotti motorcycles, broken image hotfix
  affected: public.list_public_vehicles_filtered, public.vehicles
*/

-- ---------------------------------------------------------------------------
-- fix broken unsplash URLs still referenced in demo inventory
-- ---------------------------------------------------------------------------

update public.vehicles
set images = array['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200']::text[]
where images::text like '%photo-1583121274602%';

update public.vehicles
set images = array['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200']::text[]
where images::text like '%photo-1555215695-3004980adade%';

-- ---------------------------------------------------------------------------
-- guiotti: multimarcas automóveis + motocicletas
-- ---------------------------------------------------------------------------

insert into public.vehicles (
  dealership_id,
  dealership_unit_id,
  brand,
  model,
  manufacturing_year,
  model_year,
  mileage,
  price,
  sale_price,
  images,
  description,
  status,
  public_slug,
  vehicle_type,
  is_featured,
  is_active
)
select
  d.id,
  u.id,
  v.brand,
  v.model,
  v.manufacturing_year,
  v.model_year,
  v.mileage,
  v.price,
  v.price,
  v.images,
  v.description,
  'available',
  v.public_slug,
  v.vehicle_type,
  v.is_featured,
  true
from public.dealerships as d
inner join lateral (
  select du.id
  from public.dealership_units as du
  where du.dealership_id = d.id
  order by du.sort_order asc, du.created_at asc
  limit 1
) as u on true
inner join (
  values
    (
      'Ducati',
      'Panigale V4',
      2023,
      2023,
      2100,
      189000.00,
      'demo-ducati-panigale',
      'motocicleta',
      true,
      array['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200']::text[],
      'Superbike italiana com pacote racing e revisões em dia.'
    ),
    (
      'Harley-Davidson',
      'Fat Boy',
      2022,
      2022,
      6800,
      129000.00,
      'demo-harley-fatboy',
      'motocicleta',
      false,
      array['https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200']::text[],
      'Custom cruiser icônica, pronta para estrada.'
    ),
    (
      'BMW',
      'R 1250 GS',
      2021,
      2022,
      14500,
      98000.00,
      'demo-bmw-r1250gs',
      'motocicleta',
      false,
      array['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200']::text[],
      'Big trail premium para viagens longas com conforto.'
    )
) as v(brand, model, manufacturing_year, model_year, mileage, price, public_slug, vehicle_type, is_featured, images, description)
  on true
where d.slug = 'guiotti'
on conflict (dealership_id, public_slug) do update
set
  brand = excluded.brand,
  model = excluded.model,
  manufacturing_year = excluded.manufacturing_year,
  model_year = excluded.model_year,
  mileage = excluded.mileage,
  price = excluded.price,
  sale_price = excluded.sale_price,
  images = excluded.images,
  description = excluded.description,
  vehicle_type = excluded.vehicle_type,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  status = excluded.status;

update public.dealerships
set content_config = coalesce(content_config, '{}'::jsonb) || jsonb_build_object(
  'about_text',
  'Automóveis premium e motocicletas selecionadas — curadoria multimarcas com revisão completa e atendimento consultivo.',
  'sells_motorcycles',
  true
)
where slug = 'guiotti';

-- ---------------------------------------------------------------------------
-- public listing RPC: optional vehicle_type filter
-- ---------------------------------------------------------------------------

create or replace function public.list_public_vehicles_filtered(
  p_dealership_id uuid,
  p_brand text default null,
  p_model text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_min_year integer default null,
  p_max_year integer default null,
  p_vehicle_type text default null
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
  order by v.created_at desc;
$$;

comment on function public.list_public_vehicles_filtered(uuid, text, text, numeric, numeric, integer, integer, text) is
  'Public storefront inventory with optional brand/model/price/year/vehicle_type filters; active available vehicles only.';

revoke all on function public.list_public_vehicles_filtered(uuid, text, text, numeric, numeric, integer, integer, text) from public;

drop function if exists public.list_public_vehicles_filtered(uuid, text, text, numeric, numeric, integer, integer);

grant execute on function public.list_public_vehicles_filtered(uuid, text, text, numeric, numeric, integer, integer, text)
  to anon, authenticated;
