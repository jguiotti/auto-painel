/*
  migration: fix dealerships trigger after enabled_features removal
  purpose:
    - avoid runtime errors when updating dealerships rows
    - keep guard preventing tenant-side pricing_plan_id changes
*/

create or replace function public.dealerships_block_tenant_plan_feature_updates()
returns trigger
language plpgsql
security definer
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
