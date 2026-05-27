/*
  migration: leads assignee column, business plan module scope, demo vehicle image hotfix
  affected: public.leads, public.pricing_plan_modules, public.vehicles
*/

-- ---------------------------------------------------------------------------
-- leads: assignee for seller-scoped CRM (missing on some remote environments)
-- ---------------------------------------------------------------------------

alter table public.leads
  add column if not exists assigned_user_id uuid references auth.users (id) on delete set null;

create index if not exists leads_assigned_user_id_idx
  on public.leads (assigned_user_id)
  where assigned_user_id is not null;

comment on column public.leads.assigned_user_id is
  'Dealership user responsible for the lead; sellers only see rows assigned to themselves.';

-- ---------------------------------------------------------------------------
-- business plan: finance + QR only (product spec for demo gating)
-- ---------------------------------------------------------------------------

delete from public.pricing_plan_modules as ppm
using public.pricing_plans as pp
where ppm.pricing_plan_id = pp.id
  and pp.slug = 'business';

insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select pp.id, sm.id
from public.pricing_plans as pp
inner join public.saas_modules as sm on sm.key in ('finance_simulator', 'qr_generator')
where pp.slug = 'business';

-- ---------------------------------------------------------------------------
-- demo seed: replace broken unsplash URLs (404 on next/image optimizer)
-- ---------------------------------------------------------------------------

update public.vehicles as v
set images = array['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200']::text[]
where v.public_slug = 'demo-bmw-m4';

update public.vehicles as v
set images = array['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200']::text[]
where v.public_slug = 'demo-amg-gt';
