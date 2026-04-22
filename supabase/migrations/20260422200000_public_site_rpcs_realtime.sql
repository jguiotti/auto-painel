/*
  migration: public site rpcs (dealership id, filtered listing, vehicle by id) + realtime for leads
*/

-- ---------------------------------------------------------------------------
-- dealership by id (public vitrine / theme)
-- ---------------------------------------------------------------------------

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
  limit 1;
$$;

comment on function public.get_dealership_public_by_id(uuid) is
  'public storefront: single dealership row by id for whitelabel and metadata';

revoke all on function public.get_dealership_public_by_id(uuid) from public;
grant execute on function public.get_dealership_public_by_id(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- filtered available vehicles for a dealership
-- ---------------------------------------------------------------------------

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

comment on function public.list_public_vehicles_filtered(uuid, text, text, numeric, numeric, integer, integer) is
  'public vitrine: available vehicles with optional filters';

revoke all on function public.list_public_vehicles_filtered(uuid, text, text, numeric, numeric, integer, integer) from public;
grant execute on function public.list_public_vehicles_filtered(uuid, text, text, numeric, numeric, integer, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- single public vehicle (available only, tenant scoped)
-- ---------------------------------------------------------------------------

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
  where v.id = p_vehicle_id
    and v.dealership_id = p_dealership_id
    and v.status = 'available'
  limit 1;
$$;

comment on function public.get_public_vehicle_by_id(uuid, uuid) is
  'public detail page: one available vehicle scoped to dealership';

revoke all on function public.get_public_vehicle_by_id(uuid, uuid) from public;
grant execute on function public.get_public_vehicle_by_id(uuid, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- realtime: new leads visible to authenticated subscribers (rls applies)
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.leads;
