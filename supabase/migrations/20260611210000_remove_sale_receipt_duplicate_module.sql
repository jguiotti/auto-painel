/*
  migration: remove duplicate sale_receipt saas module (keep recibo_compra)
  purpose:
    - canonical catalog key is recibo_compra (operator-facing module)
    - sale_receipt was legacy duplicate from initial scaffold migration
  affected: public.saas_modules, public.pricing_plan_modules, private.assert_sale_receipt_enabled
*/

-- ensure recibo_compra exists before removing sale_receipt
insert into public.saas_modules (key, display_name, description, sort_order, is_active)
values (
  'recibo_compra',
  'Recibo de compra/venda',
  'Recibo simples de compra e venda para veículos vendidos (sem validade fiscal).',
  37,
  true
)
on conflict (key) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- copy plan pivots from legacy sale_receipt to recibo_compra
insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select distinct ppm.pricing_plan_id, canonical.id
from public.pricing_plan_modules as ppm
inner join public.saas_modules as legacy
  on legacy.id = ppm.module_id
  and legacy.key = 'sale_receipt'
inner join public.saas_modules as canonical
  on canonical.key = 'recibo_compra'
on conflict do nothing;

-- remove legacy module from all plans
delete from public.pricing_plan_modules
where module_id in (
  select id
  from public.saas_modules
  where key = 'sale_receipt'
);

delete from public.saas_modules
where key = 'sale_receipt';

-- gate RPCs on canonical key only
create or replace function private.assert_sale_receipt_enabled(
  p_dealership_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (
    'recibo_compra' = any(
      public.effective_feature_keys_for_active_dealership(p_dealership_id)
    )
  ) then
    raise exception 'module_not_enabled';
  end if;
end;
$$;

comment on function private.assert_sale_receipt_enabled(uuid) is
  'Raises module_not_enabled when recibo_compra is not effective for the dealership.';

revoke all on function private.assert_sale_receipt_enabled(uuid) from public;
grant execute on function private.assert_sale_receipt_enabled(uuid) to authenticated, service_role;

comment on function public.upsert_vehicle_sale_receipt(uuid, text, text, text, jsonb, numeric, numeric, text, text) is
  'Creates or updates sale receipt for a sold vehicle; requires recibo_compra module.';

comment on function public.get_vehicle_sale_receipt(uuid) is
  'Returns sale receipt for vehicle in caller dealership; requires recibo_compra module.';
