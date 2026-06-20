/*
  migration: storefront inventory pagination
  purpose:
    - paginate public vehicle listings (large stock performance)
    - server-side sort for consistent paging
  affected:
    - public.list_public_vehicles_filtered (p_limit, p_offset, p_sort)
    - public.count_public_vehicles_filtered (new)
*/

drop function if exists public.list_public_vehicles_filtered(
  uuid, text, text, numeric, numeric, integer, integer, text, integer, integer, text, text, text, integer, integer, integer
);

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
  p_gear_count integer default null,
  p_limit integer default null,
  p_offset integer default 0,
  p_sort text default 'newest'
)
returns setof public.vehicles
language sql
stable
security definer
set search_path = ''
as $$
  with filtered as (
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
  )
  select f.*
  from filtered as f
  order by
    case when coalesce(nullif(trim(p_sort), ''), 'newest') = 'newest' then
      case when f.is_featured then 0 else 1 end
    end,
    case when coalesce(nullif(trim(p_sort), ''), 'newest') = 'newest' then f.featured_sort_order end nulls last,
    case when coalesce(nullif(trim(p_sort), ''), 'newest') = 'newest' then f.created_at end desc,
    case when trim(p_sort) = 'price_asc' then coalesce(f.sale_price, f.price) end asc nulls last,
    case when trim(p_sort) = 'price_desc' then coalesce(f.sale_price, f.price) end desc nulls last,
    case when trim(p_sort) = 'year_desc' then f.model_year end desc nulls last,
    case when trim(p_sort) = 'mileage_asc' then f.mileage end asc nulls last,
    f.id asc
  offset greatest(coalesce(p_offset, 0), 0)
  limit case when p_limit is null or p_limit < 1 then null else p_limit end;
$$;

comment on function public.list_public_vehicles_filtered(
  uuid, text, text, numeric, numeric, integer, integer, text, integer, integer, text, text, text, integer, integer, integer, integer, integer, text
) is 'Public storefront inventory with filters, server-side sort and optional pagination.';

create or replace function public.count_public_vehicles_filtered(
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
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::bigint
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
    and (p_gear_count is null or v.gear_count = p_gear_count);
$$;

comment on function public.count_public_vehicles_filtered(
  uuid, text, text, numeric, numeric, integer, integer, text, integer, integer, text, text, text, integer, integer, integer
) is 'Count public storefront vehicles matching the same filters as list_public_vehicles_filtered.';

revoke all on function public.list_public_vehicles_filtered(
  uuid, text, text, numeric, numeric, integer, integer, text, integer, integer, text, text, text, integer, integer, integer, integer, integer, text
) from public;

grant execute on function public.list_public_vehicles_filtered(
  uuid, text, text, numeric, numeric, integer, integer, text, integer, integer, text, text, text, integer, integer, integer, integer, integer, text
) to anon, authenticated;

revoke all on function public.count_public_vehicles_filtered(
  uuid, text, text, numeric, numeric, integer, integer, text, integer, integer, text, text, text, integer, integer, integer
) from public;

grant execute on function public.count_public_vehicles_filtered(
  uuid, text, text, numeric, numeric, integer, integer, text, integer, integer, text, text, text, integer, integer, integer
) to anon, authenticated;

notify pgrst, 'reload schema';
