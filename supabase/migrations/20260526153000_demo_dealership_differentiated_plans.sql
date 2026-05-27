/*
  migration: assign differentiated pricing plans to demo dealerships (module gating QA)
  affected: public.dealerships (guiotti, autoprime, ecodrive)
  notes:
    - guiotti → enterprise (all modules)
    - autoprime → business (finance + QR)
    - ecodrive → starter (finance only)
    - temporarily disables plan guard trigger (postgres migration role is not service_role)
*/

alter table public.dealerships disable trigger dealerships_block_tenant_plan_features_trigger;

update public.dealerships as d
set pricing_plan_id = pp.id
from public.pricing_plans as pp
where d.slug = 'guiotti'
  and pp.slug = 'enterprise';

update public.dealerships as d
set pricing_plan_id = pp.id
from public.pricing_plans as pp
where d.slug = 'autoprime'
  and pp.slug = 'business';

update public.dealerships as d
set pricing_plan_id = pp.id
from public.pricing_plans as pp
where d.slug = 'ecodrive'
  and pp.slug = 'starter';

alter table public.dealerships enable trigger dealerships_block_tenant_plan_features_trigger;
