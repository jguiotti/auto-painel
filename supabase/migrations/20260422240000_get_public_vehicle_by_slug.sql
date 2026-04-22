/*
  migration: public vehicle detail by dealership + public_slug (SEO-friendly URLs)
*/

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
    and d.status = 'active'
  limit 1;
$$;

comment on function public.get_public_vehicle_by_slug(uuid, text) is
  'public detail: one available vehicle by tenant and public_slug';

revoke all on function public.get_public_vehicle_by_slug(uuid, text) from public;
grant execute on function public.get_public_vehicle_by_slug(uuid, text) to anon, authenticated;
