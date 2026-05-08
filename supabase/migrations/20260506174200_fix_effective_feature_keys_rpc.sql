/*
  migration: fix effective_feature_keys_for_active_dealership for schema without enabled_features
  purpose:
    - remove reference to public.dealerships.enabled_features (column no longer present)
    - keep pricing_plan-based resolution as source of truth
    - preserve active dealership guard for anon and tenant scope checks for authenticated
*/

create or replace function public.effective_feature_keys_for_active_dealership(p_dealership_id uuid)
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

comment on function public.effective_feature_keys_for_active_dealership(uuid) is
  'Returns effective module keys for a dealership: pricing_plan pivot when pricing_plan_id set; otherwise all active catalog modules. Enforces anon/active + tenant scope for authenticated callers.';
