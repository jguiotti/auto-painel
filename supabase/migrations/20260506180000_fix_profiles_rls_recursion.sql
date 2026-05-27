/*
  migration: fix profiles rls recursion with helper functions
  purpose:
    - remove self-referential subqueries in profiles policies
    - provide stable helpers for current dealership and role lookups
    - restore safe profile reads for own row and same-tenant peers
*/

create or replace function public.current_profile_dealership_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.dealership_id
  from public.profiles as p
  where p.id = (select auth.uid())
  limit 1;
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_profile_dealership_id() from public;
revoke all on function public.current_profile_role() from public;

grant execute on function public.current_profile_dealership_id() to authenticated, service_role;
grant execute on function public.current_profile_role() to authenticated, service_role;

alter policy "profiles_select_authenticated_same_tenant"
on public.profiles
using (dealership_id = public.current_profile_dealership_id());

alter policy "profiles_update_authenticated_self"
on public.profiles
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and dealership_id = public.current_profile_dealership_id()
);

-- admin_rbac migration (20260423120000) replaces admin_peers with owner_peers on fresh installs.
drop policy if exists "profiles_update_authenticated_admin_peers" on public.profiles;

drop policy if exists "profiles_update_authenticated_owner_peers" on public.profiles;

create policy "profiles_update_authenticated_owner_peers"
on public.profiles
for update
to authenticated
using (
  public.current_profile_role() = 'owner'
  and dealership_id = public.current_profile_dealership_id()
  and id <> (select auth.uid())
)
with check (
  dealership_id = public.current_profile_dealership_id()
);

drop policy if exists "profiles_select_authenticated_own_row" on public.profiles;

create policy "profiles_select_authenticated_own_row"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));
