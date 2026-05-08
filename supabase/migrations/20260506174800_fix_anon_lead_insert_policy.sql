/*
  migration: fix anon lead insert rls policy
  purpose:
    - remove dependency on public.dealerships read from anon role inside leads insert policy
    - keep tenant-bound guarantee through vehicle/dealership match and available status
*/

alter policy "leads_insert_anon_for_available_vehicle"
on public.leads
with check (
  exists (
    select 1
    from public.vehicles as v
    where v.id = leads.vehicle_id
      and v.dealership_id = leads.dealership_id
      and v.status = 'available'
  )
);
