-- migration: platform finance simulator global settings
-- purpose: persist a global monthly interest rate for finance simulations
-- affected objects:
--   - table public.platform_finance_settings
--   - rls policies for controlled read/write access
-- notes:
--   - designed as singleton table (id = 1) to simplify admin operations
--   - keeps room for future dealership-level override without breaking global default

create table public.platform_finance_settings (
  id smallint primary key default 1 check (id = 1),
  finance_monthly_interest_rate_percent numeric(8, 4) not null default 1.9900,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_finance_settings_rate_non_negative
    check (finance_monthly_interest_rate_percent >= 0)
);

comment on table public.platform_finance_settings is
  'global platform settings for finance simulator defaults.';

comment on column public.platform_finance_settings.finance_monthly_interest_rate_percent is
  'default monthly interest rate (percent) used in finance simulator estimations.';

insert into public.platform_finance_settings (id, finance_monthly_interest_rate_percent)
values (1, 1.9900)
on conflict (id) do nothing;

alter table public.platform_finance_settings enable row level security;

create policy "platform_finance_settings_select_public"
on public.platform_finance_settings
for select
to anon, authenticated
using (true);

create policy "platform_finance_settings_update_super_admin"
on public.platform_finance_settings
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
      and p.dealership_id is null
  )
)
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
      and p.dealership_id is null
  )
);

grant select on public.platform_finance_settings to anon, authenticated;
grant update on public.platform_finance_settings to authenticated;
