/*
  migration: storefront host resolver — private SECURITY DEFINER impl + public INVOKER delegate
  purpose:
    - align with get_dealership_public_by_slug and resolve_dealership_id_by_host_for_dashboard: PostgREST
      calls a SECURITY INVOKER public function; matching runs in private.*_impl (SECURITY DEFINER).
    - without this split, SELECTs on public.dealerships inside a single public SECURITY DEFINER function
      can still be subject to RLS as the invoker (anon), returning no row and thus null — breaking vitrine.
  affected:
    - new: private.resolve_dealership_id_by_host_impl
    - replace: public.resolve_dealership_id_by_host (sql delegate)
*/

create or replace function private.resolve_dealership_id_by_host_impl(
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
  -- Ensure reads on dealerships are not blocked by RLS for role anon (Supabase PostgREST).
  -- Runs as SECURITY DEFINER owner; requires a privileged owner (e.g. postgres) on hosted Supabase.
  perform set_config('row_security', 'off', true);

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
    and d.status = 'active'
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
  where lower(trim(d.slug)) = v_subdomain_slug
    and d.status = 'active'
  limit 1;

  return r_id;
end;
$$;

comment on function private.resolve_dealership_id_by_host_impl(text, text) is
  'internal: maps host to active dealership id; invoked only from public.resolve_dealership_id_by_host';

create or replace function public.resolve_dealership_id_by_host(
  p_host text,
  p_platform_root_domain text
)
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select private.resolve_dealership_id_by_host_impl(p_host, p_platform_root_domain);
$$;

comment on function public.resolve_dealership_id_by_host(text, text) is
  'delegates to private.resolve_dealership_id_by_host_impl; maps request host to active dealership id';

revoke all on function private.resolve_dealership_id_by_host_impl(text, text) from public;
grant execute on function private.resolve_dealership_id_by_host_impl(text, text) to anon, authenticated;

revoke all on function public.resolve_dealership_id_by_host(text, text) from public;
grant execute on function public.resolve_dealership_id_by_host(text, text) to anon, authenticated;
