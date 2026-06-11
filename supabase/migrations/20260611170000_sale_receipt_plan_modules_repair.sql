/*
  migration: repair sale_receipt module on pricing plans
  purpose:
    - ensure sale_receipt pivot exists for trial, business, and enterprise
    - backfill enterprise with any active catalog modules missing from pivot (e.g. modules added after initial seed)
  notes: idempotent; safe to re-run
*/

insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select pp.id, sm.id
from public.pricing_plans as pp
inner join public.saas_modules as sm on sm.key = 'sale_receipt'
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
