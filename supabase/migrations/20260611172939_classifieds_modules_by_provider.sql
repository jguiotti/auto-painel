/*
  migration: split classifieds SaaS modules by provider (remove bundle)
  purpose:
    - one catalog key per portal: olx_sync, webmotors_sync, icarros_sync
    - remove legacy classifieds_sync module and plan pivots
    - attach the three modules to enterprise and trial plans
  affected: public.saas_modules, public.pricing_plan_modules
*/

-- per-portal module catalog entries
insert into public.saas_modules (key, display_name, description, sort_order, is_active)
values
  (
    'olx_sync',
    'Integração OLX',
    'Conexão OAuth e sincronização de anúncios com OLX.',
    33,
    true
  ),
  (
    'webmotors_sync',
    'Integração WebMotors',
    'Conexão OAuth e sincronização de anúncios com WebMotors.',
    34,
    true
  ),
  (
    'icarros_sync',
    'Integração iCarros',
    'Conexão OAuth e sincronização de anúncios com iCarros.',
    35,
    true
  )
on conflict (key) do update
set
  display_name = excluded.display_name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- copy plan pivots from legacy bundle to all three portal modules
insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select distinct ppm.pricing_plan_id, portal.id
from public.pricing_plan_modules as ppm
inner join public.saas_modules as bundle
  on bundle.id = ppm.module_id
  and bundle.key = 'classifieds_sync'
cross join public.saas_modules as portal
where portal.key in ('olx_sync', 'webmotors_sync', 'icarros_sync')
on conflict do nothing;

-- enterprise + trial: full classifieds stack (all active portal modules)
insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select pp.id, sm.id
from public.pricing_plans as pp
cross join public.saas_modules as sm
where pp.slug in ('enterprise', 'trial')
  and sm.key in ('olx_sync', 'webmotors_sync', 'icarros_sync')
on conflict do nothing;

-- remove legacy bundle from all plans
delete from public.pricing_plan_modules
where module_id in (
  select id
  from public.saas_modules
  where key = 'classifieds_sync'
);

delete from public.saas_modules
where key = 'classifieds_sync';

comment on table public.saas_modules is
  'Master catalog of platform modules toggled via pricing plans. Classifieds: olx_sync, webmotors_sync, icarros_sync (one module per portal).';
