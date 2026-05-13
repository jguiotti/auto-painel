/*
  migration: security advisor hardening (Supabase linter)
  purpose:
    - remove storage.objects SELECT policy that enabled public bucket enumeration
    - move profile RLS helper functions into schema `private` (not REST-exposed); drop public wrappers
    - express explicit deny JWT policies on secret credential tables (RLS toggled without policies lint)
    - make dealerships plan-guard trigger SECURITY INVOKER (no SECURITY DEFINER REST surface)
    - tighten disconnect_meta RPC privileges (authenticated only via explicit grants)
  notes:
    - storefront RPCs stay SECURITY DEFINER with tight bodies; anon cannot SELECT base tables safely without
      cross-tenant exposure, so exposing them only through controlled RPCs remains the least-bad posture.
*/

-- ---------------------------------------------------------------------------
-- 1) storage — public buckets do not need object listing policies for CDN-style GET
-- ---------------------------------------------------------------------------

drop policy if exists "dealership_branding_select_public" on storage.objects;

-- ---------------------------------------------------------------------------
-- 2) private schema helpers — recursion-safe lookups off PostgREST /rest/v1/rpc/*
-- ---------------------------------------------------------------------------

create schema if not exists private;

comment on schema private is
  'PostgreSQL-internal helpers referenced by public RLS; schema is not mounted in Supabase REST (default db-schemas = public).';

revoke all on schema private from public;
grant usage on schema private to postgres, authenticated, service_role;

create or replace function private.current_profile_dealership_id()
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

create or replace function private.current_profile_role()
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

revoke all on function private.current_profile_dealership_id() from public;
revoke all on function private.current_profile_role() from public;
grant execute on function private.current_profile_dealership_id() to authenticated, service_role;
grant execute on function private.current_profile_role() to authenticated, service_role;

alter policy "profiles_select_authenticated_same_tenant"
on public.profiles
using (dealership_id = private.current_profile_dealership_id());

alter policy "profiles_update_authenticated_self"
on public.profiles
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and dealership_id = private.current_profile_dealership_id()
);

-- Remote DBs may still have legacy peer policies (admin_peers / owner_peers) that reference public.current_profile_*.
drop policy if exists "profiles_update_authenticated_admin_peers" on public.profiles;

drop policy if exists "profiles_update_authenticated_owner_peers" on public.profiles;

drop policy if exists "profiles_update_authenticated_leader_peers" on public.profiles;

create policy "profiles_update_authenticated_leader_peers"
on public.profiles
for update
to authenticated
using (
  private.current_profile_role() = any (array['owner'::text, 'manager'::text])
  and dealership_id = private.current_profile_dealership_id()
  and id <> (select auth.uid())
)
with check (
  dealership_id = private.current_profile_dealership_id()
);

alter policy "vehicle_view_events_select_authenticated_same_tenant"
on public.vehicle_view_events
using (dealership_id = private.current_profile_dealership_id());

alter policy "vehicle_view_events_insert_authenticated_same_tenant"
on public.vehicle_view_events
with check (
  dealership_id = private.current_profile_dealership_id()
  and exists (
    select 1
    from public.vehicles as v
    where v.id = vehicle_view_events.vehicle_id
      and v.dealership_id = vehicle_view_events.dealership_id
      and v.status = 'available'
  )
);

drop function if exists public.current_profile_dealership_id();

drop function if exists public.current_profile_role();

-- ---------------------------------------------------------------------------
-- 3) dealerships plan guard trigger — SECURITY INVOKER (trigger body only queries caller-scoped profiles)
-- ---------------------------------------------------------------------------

create or replace function public.dealerships_block_tenant_plan_feature_updates()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if (select auth.role()) = 'service_role' then
    return new;
  end if;

  if exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  ) then
    return new;
  end if;

  if new.pricing_plan_id is distinct from old.pricing_plan_id then
    raise exception 'Apenas a equipa AutoPainel pode alterar o plano.';
  end if;

  return new;
end;
$$;

revoke all on function public.dealerships_block_tenant_plan_feature_updates() from public;

grant execute on function public.dealerships_block_tenant_plan_feature_updates() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4) credential tables — explicit deny JWT DML/select (workers use service_role which bypasses rls)
-- ---------------------------------------------------------------------------

drop policy if exists "dealership_meta_credentials_deny_anon_authenticated_select"
  on public.dealership_meta_credentials;
drop policy if exists "dealership_meta_credentials_deny_anon_authenticated_insert"
  on public.dealership_meta_credentials;
drop policy if exists "dealership_meta_credentials_deny_anon_authenticated_update"
  on public.dealership_meta_credentials;
drop policy if exists "dealership_meta_credentials_deny_anon_authenticated_delete"
  on public.dealership_meta_credentials;

drop policy if exists "dealership_classifieds_credentials_deny_anon_authenticated_select"
  on public.dealership_classifieds_credentials;
drop policy if exists "dealership_classifieds_credentials_deny_anon_authenticated_insert"
  on public.dealership_classifieds_credentials;
drop policy if exists "dealership_classifieds_credentials_deny_anon_authenticated_update"
  on public.dealership_classifieds_credentials;
drop policy if exists "dealership_classifieds_credentials_deny_anon_authenticated_delete"
  on public.dealership_classifieds_credentials;

create policy "dealership_meta_credentials_deny_anon_authenticated_select"
on public.dealership_meta_credentials
for select
to anon, authenticated
using (false);

create policy "dealership_meta_credentials_deny_anon_authenticated_insert"
on public.dealership_meta_credentials
for insert
to anon, authenticated
with check (false);

create policy "dealership_meta_credentials_deny_anon_authenticated_update"
on public.dealership_meta_credentials
for update
to anon, authenticated
using (false)
with check (false);

create policy "dealership_meta_credentials_deny_anon_authenticated_delete"
on public.dealership_meta_credentials
for delete
to anon, authenticated
using (false);

create policy "dealership_classifieds_credentials_deny_anon_authenticated_select"
on public.dealership_classifieds_credentials
for select
to anon, authenticated
using (false);

create policy "dealership_classifieds_credentials_deny_anon_authenticated_insert"
on public.dealership_classifieds_credentials
for insert
to anon, authenticated
with check (false);

create policy "dealership_classifieds_credentials_deny_anon_authenticated_update"
on public.dealership_classifieds_credentials
for update
to anon, authenticated
using (false)
with check (false);

create policy "dealership_classifieds_credentials_deny_anon_authenticated_delete"
on public.dealership_classifieds_credentials
for delete
to anon, authenticated
using (false);

-- ---------------------------------------------------------------------------
-- 5) Meta disconnect RPC — not callable anonymously
-- ---------------------------------------------------------------------------

revoke all on function public.disconnect_dealership_meta_connection() from public;

revoke execute on function public.disconnect_dealership_meta_connection() from anon;

grant execute on function public.disconnect_dealership_meta_connection() to authenticated;
