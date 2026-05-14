-- migration: super_admin max access for dealership panel workflows
-- purpose:
--   - allow platform operators (super_admin) to operate any dealership host in dealership-panel
--   - keep explicit rls policies so authenticated users without this role remain tenant-scoped
-- affected objects:
--   - public.dealerships
--   - public.profiles
--   - public.vehicles
--   - public.leads
--   - public.dealership_units
--   - public.vehicle_view_events
--   - public.dealership_classifieds_connections
--   - public.dealership_classifieds_oauth_sessions
--   - public.dealership_meta_connections
--   - public.dealership_meta_oauth_sessions

grant select, insert, update, delete on table public.vehicles to authenticated;
grant select, insert, update, delete on table public.leads to authenticated;
grant select on table public.dealerships to authenticated;
grant select on table public.profiles to authenticated;
grant select on table public.dealership_units to authenticated;
grant select, insert on table public.vehicle_view_events to authenticated;
grant select, insert, update on table public.dealership_classifieds_connections to authenticated;
grant select, insert, update on table public.dealership_meta_connections to authenticated;
grant insert on table public.dealership_classifieds_oauth_sessions to authenticated;
grant insert on table public.dealership_meta_oauth_sessions to authenticated;

create policy "dealerships_select_super_admin"
on public.dealerships
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "profiles_select_super_admin"
on public.profiles
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "vehicles_select_super_admin"
on public.vehicles
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "vehicles_insert_super_admin"
on public.vehicles
for insert
to authenticated
with check ((select public.is_platform_super_admin()));

create policy "vehicles_update_super_admin"
on public.vehicles
for update
to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "vehicles_delete_super_admin"
on public.vehicles
for delete
to authenticated
using ((select public.is_platform_super_admin()));

create policy "leads_select_super_admin"
on public.leads
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "leads_insert_super_admin"
on public.leads
for insert
to authenticated
with check ((select public.is_platform_super_admin()));

create policy "leads_update_super_admin"
on public.leads
for update
to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "leads_delete_super_admin"
on public.leads
for delete
to authenticated
using ((select public.is_platform_super_admin()));

create policy "dealership_units_select_super_admin"
on public.dealership_units
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "vehicle_view_events_select_super_admin"
on public.vehicle_view_events
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "vehicle_view_events_insert_super_admin"
on public.vehicle_view_events
for insert
to authenticated
with check ((select public.is_platform_super_admin()));

create policy "dealership_classifieds_connections_select_super_admin"
on public.dealership_classifieds_connections
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "dealership_classifieds_connections_insert_super_admin"
on public.dealership_classifieds_connections
for insert
to authenticated
with check ((select public.is_platform_super_admin()));

create policy "dealership_classifieds_connections_update_super_admin"
on public.dealership_classifieds_connections
for update
to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "dealership_classifieds_oauth_sessions_insert_super_admin"
on public.dealership_classifieds_oauth_sessions
for insert
to authenticated
with check ((select public.is_platform_super_admin()));

create policy "dealership_meta_connections_select_super_admin"
on public.dealership_meta_connections
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "dealership_meta_connections_insert_super_admin"
on public.dealership_meta_connections
for insert
to authenticated
with check ((select public.is_platform_super_admin()));

create policy "dealership_meta_connections_update_super_admin"
on public.dealership_meta_connections
for update
to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "dealership_meta_oauth_sessions_insert_super_admin"
on public.dealership_meta_oauth_sessions
for insert
to authenticated
with check ((select public.is_platform_super_admin()));
