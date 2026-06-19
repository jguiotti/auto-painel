/*
  migration: feedback operacional — storefront featured sort order
  purpose: order public vehicle listings with featured_sort_order asc among featured units
  affected: public.list_public_vehicles_filtered
*/

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
  order by
    case when v.is_featured then 0 else 1 end,
    v.featured_sort_order nulls last,
    v.created_at desc;
$$;

comment on function public.list_public_vehicles_filtered(
  uuid, text, text, numeric, numeric, integer, integer, text, integer, integer, text, text, text, integer, integer, integer
) is 'Public storefront inventory; featured vehicles ordered by featured_sort_order.';

revoke all on function public.list_public_vehicles_filtered(
  uuid, text, text, numeric, numeric, integer, integer, text, integer, integer, text, text, text, integer, integer, integer
) from public;

grant execute on function public.list_public_vehicles_filtered(
  uuid, text, text, numeric, numeric, integer, integer, text, integer, integer, text, text, text, integer, integer, integer
) to anon, authenticated;

notify pgrst, 'reload schema';
