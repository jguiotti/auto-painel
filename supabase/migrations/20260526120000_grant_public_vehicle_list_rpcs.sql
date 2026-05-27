/*
  migration: restore execute grants for public vehicle listing/detail RPCs
  affected: public.list_public_vehicles_filtered, public.get_public_vehicle_by_slug,
             public.get_public_vehicle_by_id, private.get_public_vehicle_by_id_impl
  reason: 20260514030000_vehicle_catalog_fields_and_active_visibility.sql replaced function bodies
          without re-applying grants; anon callers on customer-site received permission denied.
*/

revoke all on function public.list_public_vehicles_filtered(uuid, text, text, numeric, numeric, integer, integer) from public;
grant execute on function public.list_public_vehicles_filtered(uuid, text, text, numeric, numeric, integer, integer) to anon, authenticated;

revoke all on function public.get_public_vehicle_by_slug(uuid, text) from public;
grant execute on function public.get_public_vehicle_by_slug(uuid, text) to anon, authenticated;

revoke all on function public.get_public_vehicle_by_id(uuid, uuid) from public;
grant execute on function public.get_public_vehicle_by_id(uuid, uuid) to anon, authenticated;

revoke all on function private.get_public_vehicle_by_id_impl(uuid, uuid) from public;
grant execute on function private.get_public_vehicle_by_id_impl(uuid, uuid) to anon, authenticated;
