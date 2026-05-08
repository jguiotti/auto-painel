/*
  migration: fix anon lead insert policy using security definer public vehicle rpc
  purpose:
    - anon cannot read public.vehicles directly due rls
    - use public.get_public_vehicle_by_id(uuid, uuid) to validate vehicle/dealership/status safely
*/

alter policy "leads_insert_anon_for_available_vehicle"
on public.leads
with check (
  exists (
    select 1
    from public.get_public_vehicle_by_id(leads.vehicle_id, leads.dealership_id)
  )
);
