/*
  migration: advanced metrics foundation (vehicle view events + premium plan mapping)
  purpose:
    - persist trusted vehicle view events for dealership analytics
    - enable advanced_metrics module on premium plans
*/

create table if not exists public.vehicle_view_events (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  source text not null default 'customer_site',
  viewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint vehicle_view_events_source_check
    check (source in ('customer_site'))
);

comment on table public.vehicle_view_events is
  'tenant-scoped vehicle detail view events used by advanced metrics dashboard.';

create index if not exists vehicle_view_events_dealership_viewed_at_idx
  on public.vehicle_view_events (dealership_id, viewed_at desc);

create index if not exists vehicle_view_events_vehicle_viewed_at_idx
  on public.vehicle_view_events (vehicle_id, viewed_at desc);

alter table public.vehicle_view_events enable row level security;

create policy "vehicle_view_events_select_authenticated_same_tenant"
on public.vehicle_view_events
for select
to authenticated
using (dealership_id = public.current_profile_dealership_id());

create policy "vehicle_view_events_insert_authenticated_same_tenant"
on public.vehicle_view_events
for insert
to authenticated
with check (
  dealership_id = public.current_profile_dealership_id()
  and exists (
    select 1
    from public.vehicles as v
    where v.id = vehicle_view_events.vehicle_id
      and v.dealership_id = vehicle_view_events.dealership_id
      and v.status = 'available'
  )
);

create policy "vehicle_view_events_insert_anon_for_public_vehicle"
on public.vehicle_view_events
for insert
to anon
with check (
  exists (
    select 1
    from public.get_public_vehicle_by_id(
      vehicle_view_events.vehicle_id,
      vehicle_view_events.dealership_id
    )
  )
);

grant select on public.vehicle_view_events to authenticated;
grant insert on public.vehicle_view_events to anon, authenticated;

insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select p.id, m.id
from public.pricing_plans as p
inner join public.saas_modules as m on m.key = 'advanced_metrics'
where p.slug in ('business', 'enterprise')
on conflict do nothing;
