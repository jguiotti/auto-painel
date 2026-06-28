-- migration: internal platform revenue and expense ledger for admin finance dashboard
-- affected: public.platform_revenue_entries, public.platform_expense_entries

create table if not exists public.platform_revenue_entries (
  id uuid primary key default gen_random_uuid(),
  reference_month date not null,
  category text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  description text not null,
  recognized_at date not null default current_date,
  dealership_id uuid references public.dealerships (id) on delete set null,
  billing_history_id uuid references public.dealership_billing_history (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_revenue_entries_category_check check (
    category in ('saas_subscription', 'setup_fee', 'services', 'other')
  ),
  constraint platform_revenue_entries_description_trimmed check (length(trim(description)) >= 2)
);

comment on table public.platform_revenue_entries is
  'Manual and supplemental revenue lines for AutoPainel internal finance dashboard.';

create index if not exists platform_revenue_entries_reference_month_idx
  on public.platform_revenue_entries (reference_month desc, created_at desc);

create table if not exists public.platform_expense_entries (
  id uuid primary key default gen_random_uuid(),
  reference_month date not null,
  category text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  description text not null,
  vendor_name text,
  paid_at date,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_expense_entries_category_check check (
    category in ('commission', 'infra', 'marketing', 'payroll', 'other')
  ),
  constraint platform_expense_entries_description_trimmed check (length(trim(description)) >= 2)
);

comment on table public.platform_expense_entries is
  'Operating expenses for AutoPainel internal finance dashboard.';

create index if not exists platform_expense_entries_reference_month_idx
  on public.platform_expense_entries (reference_month desc, created_at desc);

alter table public.platform_revenue_entries enable row level security;
alter table public.platform_expense_entries enable row level security;

create policy "platform_revenue_entries_select_super_admin"
on public.platform_revenue_entries
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_revenue_entries_insert_super_admin"
on public.platform_revenue_entries
for insert
to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_revenue_entries_update_super_admin"
on public.platform_revenue_entries
for update
to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "platform_revenue_entries_delete_super_admin"
on public.platform_revenue_entries
for delete
to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_expense_entries_select_super_admin"
on public.platform_expense_entries
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_expense_entries_insert_super_admin"
on public.platform_expense_entries
for insert
to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_expense_entries_update_super_admin"
on public.platform_expense_entries
for update
to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "platform_expense_entries_delete_super_admin"
on public.platform_expense_entries
for delete
to authenticated
using ((select public.is_platform_super_admin()));

drop trigger if exists trg_platform_revenue_entries_updated_at on public.platform_revenue_entries;
create trigger trg_platform_revenue_entries_updated_at
before update on public.platform_revenue_entries
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_platform_expense_entries_updated_at on public.platform_expense_entries;
create trigger trg_platform_expense_entries_updated_at
before update on public.platform_expense_entries
for each row
execute function public.set_updated_at_timestamp();

grant select, insert, update, delete on public.platform_revenue_entries to authenticated;
grant select, insert, update, delete on public.platform_expense_entries to authenticated;
