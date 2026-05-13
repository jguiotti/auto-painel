/*
  migration: host resolver — strip trailing TCP port from host inputs using POSIX-safe regex
  purpose:
    - postgres strings such as ':\\d+$' do not treat \\d as a digit class unless written as E':\\d+$';
      deployed impls effectively matched the literal substring "\\d", so ports like ":3002" were never
      stripped — suffix checks failed (ex. guiotti.localhost:3002 vs platform root localhost).
    - replaces trailing ":digits" removal with pattern ':[0-9]+$' for p_host and p_platform_root_domain.
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

  v_host := lower(trim(regexp_replace(p_host, ':[0-9]+$', '')));
  if v_host like 'www.%' then
    v_host := substring(v_host from 5);
  end if;

  select d.id into r_id
  from public.dealerships as d
  where nullif(trim(d.custom_domain), '') is not null
    and lower(regexp_replace(trim(d.custom_domain), '^www\.', '')) = v_host
    and lower(trim(d.status)) = 'active'
  limit 1;

  if r_id is not null then
    return r_id;
  end if;

  if p_platform_root_domain is null or length(trim(p_platform_root_domain)) = 0 then
    return null;
  end if;

  v_root := lower(trim(regexp_replace(p_platform_root_domain, ':[0-9]+$', '')));

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
    and lower(trim(d.status)) = 'active'
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

  v_host := lower(trim(regexp_replace(p_host, ':[0-9]+$', '')));
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

  v_root := lower(trim(regexp_replace(p_platform_root_domain, ':[0-9]+$', '')));

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
  'internal: maps host to active dealership id; strips trailing :port via [0-9]+ suffix';

comment on function private.resolve_dealership_id_by_host_for_dashboard_impl(text, text) is
  'internal: dashboard host resolver; strips trailing :port via [0-9]+ suffix';
