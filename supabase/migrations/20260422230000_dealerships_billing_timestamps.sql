/*
  migration: dealership billing/subscription fields + audit timestamps for admin-master
  purpose:
    - subscription_plan / subscription_status / period end for financeiro view
    - created_at / updated_at for sorting and dashboards
    - optional billing_notes for internal SaaS ops
  notes: theme primary colors stay in theme_settings jsonb keys primary + primaryForeground (hex)
*/

-- ---------------------------------------------------------------------------
-- timestamps
-- ---------------------------------------------------------------------------

alter table public.dealerships
  add column if not exists created_at timestamptz not null default now();

alter table public.dealerships
  add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- billing / subscriptions (SaaS operator managed via admin-master + service role)
-- ---------------------------------------------------------------------------

alter table public.dealerships
  add column if not exists subscription_plan text;

alter table public.dealerships
  add column if not exists subscription_status text;

alter table public.dealerships
  add column if not exists subscription_current_period_end timestamptz;

alter table public.dealerships
  add column if not exists billing_notes text;

update public.dealerships
set
  subscription_plan = coalesce(nullif(trim(subscription_plan), ''), 'trial'),
  subscription_status = coalesce(nullif(trim(subscription_status), ''), 'active')
where subscription_plan is null
   or subscription_status is null;

alter table public.dealerships
  alter column subscription_plan set default 'trial';

alter table public.dealerships
  alter column subscription_plan set not null;

alter table public.dealerships
  alter column subscription_status set default 'active';

alter table public.dealerships
  alter column subscription_status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint as c
    join pg_class as r on r.oid = c.conrelid
    join pg_namespace as n on n.oid = r.relnamespace
    where c.conname = 'dealerships_subscription_plan_check'
      and n.nspname = 'public'
      and r.relname = 'dealerships'
  ) then
    alter table public.dealerships
      add constraint dealerships_subscription_plan_check check (
        subscription_plan in ('trial', 'starter', 'business', 'enterprise')
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint as c
    join pg_class as r on r.oid = c.conrelid
    join pg_namespace as n on n.oid = r.relnamespace
    where c.conname = 'dealerships_subscription_status_check'
      and n.nspname = 'public'
      and r.relname = 'dealerships'
  ) then
    alter table public.dealerships
      add constraint dealerships_subscription_status_check check (
        subscription_status in ('trialing', 'active', 'past_due', 'cancelled', 'paused')
      );
  end if;
end;
$$;

comment on column public.dealerships.subscription_plan is
  'SaaS commercial plan tier; managed by AutoPainel operators.';

comment on column public.dealerships.subscription_status is
  'Billing lifecycle for the tenant subscription.';

comment on column public.dealerships.subscription_current_period_end is
  'End of the current subscription period (renewal / invoice anchor).';

comment on column public.dealerships.billing_notes is
  'Internal notes for finance/support; not exposed to dealership users.';

comment on column public.dealerships.theme_settings is
  'Branding JSON: use keys primary and primaryForeground as #RRGGBB for client vitrine/panel theming.';

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.dealerships_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists dealerships_set_updated_at_trigger on public.dealerships;

create trigger dealerships_set_updated_at_trigger
before update on public.dealerships
for each row
execute function public.dealerships_set_updated_at();
