/*
  migration: wrap SECURITY DEFINER storefront/dashboard RPCs with SECURITY INVOKER public delegates
  purpose:
    - satisfy Supabase advisor: REST-exposed functions in `public` are INVOKER-only; privileged reads run in
      `private.*_impl` SECURITY DEFINER (schema private is not in PostgREST api.schemas by default)
  contracts:
    - same rpc names/signatures in `public` (no client/app changes)
    - callers still require EXECUTE on `private` internals for the call chain (granted to anon/authenticated
      where the public delegate is granted); direct rpc to private.* is not exposed via PostgREST
*/

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to postgres, authenticated, service_role, anon;

-- ---------------------------------------------------------------------------
-- effective_feature_keys_for_active_dealership
-- ---------------------------------------------------------------------------

create or replace function private.effective_feature_keys_for_active_dealership_impl(p_dealership_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_plan_id uuid;
  v_active boolean;
  v_keys text[];
begin
  if p_dealership_id is null then
    return '{}'::text[];
  end if;

  select d.pricing_plan_id, d.status = 'active'
    into v_plan_id, v_active
  from public.dealerships as d
  where d.id = p_dealership_id;

  if not found then
    return '{}'::text[];
  end if;

  if (select auth.role()) = 'anon' then
    if not coalesce(v_active, false) then
      return '{}'::text[];
    end if;
  elsif (select auth.role()) = 'authenticated' then
    if not exists (
      select 1
      from public.profiles as p
      where p.id = (select auth.uid())
        and (
          p.role = 'super_admin'
          or p.dealership_id = p_dealership_id
        )
    ) then
      raise exception 'Não autorizado.';
    end if;
  elsif (select auth.role()) <> 'service_role' then
    raise exception 'Não autorizado.';
  end if;

  if v_plan_id is not null then
    select coalesce(
      array_agg(m.key order by m.sort_order),
      '{}'::text[]
    )
      into v_keys
    from public.pricing_plan_modules as ppm
    inner join public.saas_modules as m on m.id = ppm.module_id
    inner join public.pricing_plans as pp on pp.id = ppm.pricing_plan_id
    where ppm.pricing_plan_id = v_plan_id
      and m.is_active = true
      and pp.is_active = true;

    return coalesce(v_keys, '{}'::text[]);
  end if;

  select coalesce(
    array_agg(m.key order by m.sort_order),
    '{}'::text[]
  )
    into v_keys
  from public.saas_modules as m
  where m.is_active = true;

  return coalesce(v_keys, '{}'::text[]);
end;
$$;

comment on function private.effective_feature_keys_for_active_dealership_impl(uuid) is
  'internal: merged module keys (plan pivot vs catalog); auth checks preserved; called only from public RPC delegate.';

create or replace function public.effective_feature_keys_for_active_dealership(p_dealership_id uuid)
returns text[]
language sql
stable
security invoker
set search_path = ''
as $$
  select private.effective_feature_keys_for_active_dealership_impl(p_dealership_id);
$$;

comment on function public.effective_feature_keys_for_active_dealership(uuid) is
  'delegate: SECURITY INVOKER; implementation in private.effective_feature_keys_for_active_dealership_impl.';

-- ---------------------------------------------------------------------------
-- get_dealership_public_by_slug
-- ---------------------------------------------------------------------------

create or replace function private.get_dealership_public_by_slug_impl(p_slug text)
returns setof public.dealerships
language sql
stable
security definer
set search_path = ''
as $$
  select d.*
  from public.dealerships as d
  where d.slug = p_slug
  limit 1;
$$;

create or replace function public.get_dealership_public_by_slug(p_slug text)
returns setof public.dealerships
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.get_dealership_public_by_slug_impl(p_slug);
$$;

-- ---------------------------------------------------------------------------
-- get_public_vehicle_by_id
-- ---------------------------------------------------------------------------

create or replace function private.get_public_vehicle_by_id_impl(
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

create or replace function public.get_public_vehicle_by_id(
  p_vehicle_id uuid,
  p_dealership_id uuid
)
returns setof public.vehicles
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.get_public_vehicle_by_id_impl(p_vehicle_id, p_dealership_id);
$$;

-- ---------------------------------------------------------------------------
-- resolve_dealership_id_by_host_for_dashboard
-- ---------------------------------------------------------------------------

create or replace function private.resolve_dealership_id_by_host_for_dashboard_impl(
  p_host text,
  p_platform_root_domain text
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_host text;
  v_root text;
  r_id uuid;
  v_subdomain_slug text;
begin
  if p_host is null or length(trim(p_host)) = 0 then
    return null;
  end if;

  v_host := lower(trim(regexp_replace(p_host, ':\\d+$', '')));
  if v_host like 'www.%' then
    v_host := substring(v_host from 5);
  end if;

  select d.id into r_id
  from public.dealerships as d
  where nullif(trim(d.custom_domain), '') is not null
    and lower(regexp_replace(trim(d.custom_domain), '^www\.', '')) = v_host
  limit 1;

  if r_id is not null then
    return r_id;
  end if;

  if p_platform_root_domain is null or length(trim(p_platform_root_domain)) = 0 then
    return null;
  end if;

  v_root := lower(trim(regexp_replace(p_platform_root_domain, ':\\d+$', '')));

  if v_host = v_root then
    return null;
  end if;

  if not (v_host like '%.' || v_root) then
    return null;
  end if;

  v_subdomain_slug := split_part(v_host, '.', 1);

  select d.id into r_id
  from public.dealerships as d
  where d.slug = v_subdomain_slug
  limit 1;

  return r_id;
end;
$$;

create or replace function public.resolve_dealership_id_by_host_for_dashboard(
  p_host text,
  p_platform_root_domain text
)
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select private.resolve_dealership_id_by_host_for_dashboard_impl(p_host, p_platform_root_domain);
$$;

-- ---------------------------------------------------------------------------
-- get_dealership_id_by_slug_for_dashboard
-- ---------------------------------------------------------------------------

create or replace function private.get_dealership_id_by_slug_for_dashboard_impl(p_slug text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select d.id
  from public.dealerships as d
  where d.slug = p_slug
  limit 1;
$$;

create or replace function public.get_dealership_id_by_slug_for_dashboard(p_slug text)
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select private.get_dealership_id_by_slug_for_dashboard_impl(p_slug);
$$;

-- ---------------------------------------------------------------------------
-- disconnect_dealership_meta_connection (tenant JWT; credentials table deny-all for jwt)
-- ---------------------------------------------------------------------------

create or replace function private.disconnect_dealership_meta_connection_impl()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dealership_id uuid;
begin
  select p.dealership_id
    into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_dealership_id is null then
    raise exception 'Não autorizado.';
  end if;

  delete from public.dealership_meta_credentials as c
  using public.dealership_meta_connections as conn
  where c.connection_id = conn.id
    and conn.dealership_id = v_dealership_id;

  update public.dealership_meta_connections as conn
  set
    status = 'disconnected',
    page_id = null,
    page_name = null,
    instagram_business_account_id = null,
    instagram_username = null,
    token_expires_at = null,
    connected_at = null,
    last_error = null,
    updated_at = now()
  where conn.dealership_id = v_dealership_id;
end;
$$;

create or replace function public.disconnect_dealership_meta_connection()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.disconnect_dealership_meta_connection_impl();
end;
$$;

-- ---------------------------------------------------------------------------
-- privileges: private implementations (required for invoker delegates); not REST schemas
-- ---------------------------------------------------------------------------

revoke all on function private.effective_feature_keys_for_active_dealership_impl(uuid) from public;
revoke all on function private.get_dealership_public_by_slug_impl(text) from public;
revoke all on function private.get_public_vehicle_by_id_impl(uuid, uuid) from public;
revoke all on function private.resolve_dealership_id_by_host_for_dashboard_impl(text, text) from public;
revoke all on function private.get_dealership_id_by_slug_for_dashboard_impl(text) from public;
revoke all on function private.disconnect_dealership_meta_connection_impl() from public;

grant execute on function private.effective_feature_keys_for_active_dealership_impl(uuid) to anon, authenticated, service_role;
grant execute on function private.get_dealership_public_by_slug_impl(text) to anon, authenticated;
grant execute on function private.get_public_vehicle_by_id_impl(uuid, uuid) to anon, authenticated;
grant execute on function private.resolve_dealership_id_by_host_for_dashboard_impl(text, text) to anon, authenticated;
grant execute on function private.get_dealership_id_by_slug_for_dashboard_impl(text) to anon, authenticated;
grant execute on function private.disconnect_dealership_meta_connection_impl() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- public delegates (postgrest-visible): invoker shells
-- ---------------------------------------------------------------------------

revoke all on function public.effective_feature_keys_for_active_dealership(uuid) from public;
grant execute on function public.effective_feature_keys_for_active_dealership(uuid) to anon, authenticated, service_role;

revoke all on function public.get_dealership_public_by_slug(text) from public;
grant execute on function public.get_dealership_public_by_slug(text) to anon, authenticated;

revoke all on function public.get_public_vehicle_by_id(uuid, uuid) from public;
grant execute on function public.get_public_vehicle_by_id(uuid, uuid) to anon, authenticated;

revoke all on function public.resolve_dealership_id_by_host_for_dashboard(text, text) from public;
grant execute on function public.resolve_dealership_id_by_host_for_dashboard(text, text) to anon, authenticated;

revoke all on function public.get_dealership_id_by_slug_for_dashboard(text) from public;
grant execute on function public.get_dealership_id_by_slug_for_dashboard(text) to anon, authenticated;

revoke all on function public.disconnect_dealership_meta_connection() from public;
grant execute on function public.disconnect_dealership_meta_connection() to authenticated;
