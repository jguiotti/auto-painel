/*
  migration: align sale receipt module gate with recibo_compra saas_modules key
  purpose:
    - operators may register the module as recibo_compra (canonical) or legacy sale_receipt
    - RPC gate must accept either key from effective_feature_keys_for_active_dealership
  notes: idempotent; does not rename existing saas_modules rows
*/

create or replace function private.assert_sale_receipt_enabled(
  p_dealership_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_keys text[];
begin
  v_keys := public.effective_feature_keys_for_active_dealership(p_dealership_id);

  if not (
    'recibo_compra' = any(v_keys)
    or 'sale_receipt' = any(v_keys)
  ) then
    raise exception 'module_not_enabled';
  end if;
end;
$$;

comment on function private.assert_sale_receipt_enabled(uuid) is
  'Raises module_not_enabled when recibo_compra (or legacy sale_receipt) is not effective for the dealership.';

revoke all on function private.assert_sale_receipt_enabled(uuid) from public;
grant execute on function private.assert_sale_receipt_enabled(uuid) to authenticated, service_role;

-- optional alias row if only legacy key exists in older environments
insert into public.saas_modules (key, display_name, description, sort_order, is_active)
values (
  'recibo_compra',
  'Recibo de compra/venda',
  'Recibo simples de compra e venda para veículos vendidos (sem validade fiscal).',
  35,
  true
)
on conflict (key) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  is_active = excluded.is_active;

-- mirror enterprise/trial/business pivot for recibo_compra (idempotent)
insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select pp.id, sm.id
from public.pricing_plans as pp
inner join public.saas_modules as sm on sm.key = 'recibo_compra'
where pp.slug in ('trial', 'business', 'enterprise')
  and sm.is_active = true
on conflict do nothing;

insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select pp.id, sm.id
from public.pricing_plans as pp
cross join public.saas_modules as sm
where pp.slug = 'enterprise'
  and sm.is_active = true
on conflict do nothing;
