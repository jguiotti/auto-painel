/*
  migration: consolidate classifieds modules (remove legacy olx_sync)
  purpose:
    - single catalog key classifieds_sync covers OLX + WebMotors (code already gates on this key)
    - remove duplicate saas_modules row olx_sync and any orphan pricing_plan_modules pivots
    - refresh classifieds_sync metadata for operator-facing catalog
*/

-- migrate any plan pivot from legacy olx_sync to classifieds_sync
insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select ppm.pricing_plan_id, cs.id
from public.pricing_plan_modules as ppm
inner join public.saas_modules as legacy
  on legacy.id = ppm.module_id
  and legacy.key = 'olx_sync'
inner join public.saas_modules as cs
  on cs.key = 'classifieds_sync'
on conflict do nothing;

delete from public.pricing_plan_modules
where module_id in (
  select id
  from public.saas_modules
  where key = 'olx_sync'
);

delete from public.saas_modules
where key = 'olx_sync';

update public.saas_modules
set
  display_name = 'Integração com classificados',
  description = 'Conexão OAuth e sincronização de anúncios com OLX e WebMotors.',
  sort_order = 35,
  is_active = true
where key = 'classifieds_sync';

comment on table public.saas_modules is
  'Master catalog of platform modules toggled via pricing plans. Classifieds portals (OLX, WebMotors) share the classifieds_sync key — no per-portal module keys.';
