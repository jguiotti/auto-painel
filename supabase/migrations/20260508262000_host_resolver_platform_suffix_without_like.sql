/*
  migration: host resolver — validate platform subdomain using suffix (right) instead of LIKE
  purpose:
    - repro: resolve_dealership_id_by_host returned null with correct slug/status/localhost while prosecdef
      was already false (public INVOKER delegate). LIKE '%.' || v_root can misbehave in edge cases; use an
      explicit suffix check: host must end with '.' || platform_root_domain.
  affected:
    - private.resolve_dealership_id_by_host_impl
    - private.resolve_dealership_id_by_host_for_dashboard_impl
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
  v_suffix_len integer;
begin
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

  v_suffix_len := char_length(v_root) + 1;
  if char_length(v_host) <= v_suffix_len then
    return null;
  end if;

  if right(v_host, v_suffix_len) <> ('.' || v_root) then
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
  v_suffix_len integer;
begin
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

  v_suffix_len := char_length(v_root) + 1;
  if char_length(v_host) <= v_suffix_len then
    return null;
  end if;

  if right(v_host, v_suffix_len) <> ('.' || v_root) then
    return null;
  end if;

  v_subdomain_slug := split_part(v_host, '.', 1);

  select d.id into r_id
  from public.dealerships as d
  where lower(trim(d.slug)) = v_subdomain_slug
  limit 1;

  return r_id;
end;
$$;

comment on function private.resolve_dealership_id_by_host_impl(text, text) is
  'internal: maps host to active dealership id; suffix match on platform root (no LIKE on full host)';

comment on function private.resolve_dealership_id_by_host_for_dashboard_impl(text, text) is
  'internal: dashboard host resolver; suffix match on platform root (no LIKE on full host)';
