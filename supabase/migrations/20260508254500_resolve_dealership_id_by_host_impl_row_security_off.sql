/*
  migration: same as 20260508253000 private impl, with row_security=off inside the DEFINER body
  purpose:
    - if 20260508253000 was already applied without set_config, RLS can still hide dealerships rows to anon;
      forcing row_security off for the transaction slice fixes null resolves on hosted Supabase.
  idempotent: safe if 53000 already included set_config (replace with identical behaviour).
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
