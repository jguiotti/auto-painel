/*
  migration: restore execute grants for get_public_vehicle_by_id
  purpose:
    - required by anon lead insert policy and public storefront server actions
*/

grant execute on function public.get_public_vehicle_by_id(uuid, uuid) to anon, authenticated;
