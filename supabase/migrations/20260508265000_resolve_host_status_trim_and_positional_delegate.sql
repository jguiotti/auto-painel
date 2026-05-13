/*
  migration: resolve host — trim/normalize dealerships.status + positional args on public delegate
  purpose:
    - storefront filter used "d.status = 'active'" while values may include leading/trailing whitespace
      from legacy imports; UI/SQL listing can still show "active" while equality fails → RPC null.
    - public.resolve_dealership_id_by_host (LANGUAGE sql) delegate now calls the impl with $1/$2 only,
      avoiding any edge case with unqualified parameter names in the SQL function body.
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
    and lower(trim(d.status)) = 'active'
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
    and lower(trim(d.status)) = 'active'
  limit 1;

  return r_id;
end;
$$;

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
  select private.resolve_dealership_id_by_host_impl($1, $2);
$$;

comment on function public.resolve_dealership_id_by_host(text, text) is
  'delegates to private.resolve_dealership_id_by_host_impl($1,$2); active = lower(trim(status))';

revoke all on function public.resolve_dealership_id_by_host(text, text) from public;
grant execute on function public.resolve_dealership_id_by_host(text, text) to anon, authenticated;
