/*
  migration: platform sales squad — commercial reps, attributions, commissions, payouts
  purpose:
    - register internal sales reps (separate from super_admin and dealership users)
    - link closed dealerships to reps with recurring commission ledger
    - portfolio transfer when rep leaves; clawback on churn within 30 days
  affected:
    - public.platform_sales_reps
    - public.platform_sales_rep_bank_accounts
    - public.platform_sales_rep_dealership_attributions
    - public.platform_sales_rep_portfolio_transfers
    - public.platform_commission_rules
    - public.platform_commission_ledger_entries
    - public.platform_incentive_campaigns
    - public.platform_payout_batches
    - public.platform_payout_batch_items
    - helper functions + RPCs for admin and rep portal
*/

-- ---------------------------------------------------------------------------
-- platform_sales_reps
-- ---------------------------------------------------------------------------

create table public.platform_sales_reps (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  document_cpf text,
  status text not null default 'onboarding',
  hire_date date,
  termination_date date,
  default_commission_rate_bps integer not null default 1000,
  user_id uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_sales_reps_full_name_trimmed check (length(trim(full_name)) >= 2),
  constraint platform_sales_reps_email_trimmed check (length(trim(email)) >= 3),
  constraint platform_sales_reps_email_format check (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  constraint platform_sales_reps_status_check check (
    status in ('active', 'inactive', 'onboarding')
  ),
  constraint platform_sales_reps_default_commission_rate_bps_check check (
    default_commission_rate_bps >= 0 and default_commission_rate_bps <= 10000
  )
);

create unique index platform_sales_reps_email_key
  on public.platform_sales_reps (lower(trim(email)));

create unique index platform_sales_reps_user_id_key
  on public.platform_sales_reps (user_id)
  where user_id is not null;

create index platform_sales_reps_status_idx
  on public.platform_sales_reps (status, created_at desc);

comment on table public.platform_sales_reps is
  'AutoPainel internal commercial representatives (not dealership sellers nor super_admin operators).';

-- ---------------------------------------------------------------------------
-- platform_sales_rep_bank_accounts
-- ---------------------------------------------------------------------------

create table public.platform_sales_rep_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  sales_rep_id uuid not null references public.platform_sales_reps (id) on delete cascade,
  payment_method text not null,
  pix_key_type text,
  pix_key text,
  bank_code text,
  branch text,
  account_number text,
  account_holder_name text not null,
  account_holder_document text not null,
  is_primary boolean not null default true,
  valid_from date not null default current_date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_sales_rep_bank_accounts_payment_method_check check (
    payment_method in ('pix', 'ted')
  ),
  constraint platform_sales_rep_bank_accounts_pix_key_type_check check (
    pix_key_type is null
    or pix_key_type in ('cpf', 'email', 'phone', 'random')
  ),
  constraint platform_sales_rep_bank_accounts_holder_name_trimmed check (
    length(trim(account_holder_name)) >= 2
  )
);

create index platform_sales_rep_bank_accounts_sales_rep_id_idx
  on public.platform_sales_rep_bank_accounts (sales_rep_id, is_primary desc);

comment on table public.platform_sales_rep_bank_accounts is
  'Payout details for platform sales reps; primary account used in payout batches.';

-- ---------------------------------------------------------------------------
-- platform_sales_rep_dealership_attributions
-- ---------------------------------------------------------------------------

create table public.platform_sales_rep_dealership_attributions (
  id uuid primary key default gen_random_uuid(),
  sales_rep_id uuid not null references public.platform_sales_reps (id) on delete restrict,
  dealership_id uuid not null references public.dealerships (id) on delete restrict,
  saas_prospect_id uuid references public.saas_prospects (id) on delete set null,
  contract_id uuid references public.platform_contracts (id) on delete set null,
  attribution_type text not null,
  attribution_share_bps integer not null default 10000,
  closed_at timestamptz not null default now(),
  first_invoice_amount_cents integer,
  plan_key text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_sales_rep_dealership_attributions_type_check check (
    attribution_type in ('closer', 'sdr', 'referral')
  ),
  constraint platform_sales_rep_dealership_attributions_status_check check (
    status in ('pending', 'confirmed', 'disputed', 'cancelled')
  ),
  constraint platform_sales_rep_dealership_attributions_share_bps_check check (
    attribution_share_bps > 0 and attribution_share_bps <= 10000
  )
);

create index platform_sales_rep_dealership_attributions_rep_idx
  on public.platform_sales_rep_dealership_attributions (sales_rep_id, status);

create index platform_sales_rep_dealership_attributions_dealership_idx
  on public.platform_sales_rep_dealership_attributions (dealership_id, status);

comment on table public.platform_sales_rep_dealership_attributions is
  'Links a closed dealership to a sales rep for recurring commission calculation.';

-- ---------------------------------------------------------------------------
-- platform_sales_rep_portfolio_transfers
-- ---------------------------------------------------------------------------

create table public.platform_sales_rep_portfolio_transfers (
  id uuid primary key default gen_random_uuid(),
  from_sales_rep_id uuid not null references public.platform_sales_reps (id) on delete restrict,
  to_sales_rep_id uuid not null references public.platform_sales_reps (id) on delete restrict,
  effective_at timestamptz not null,
  dealership_ids uuid[],
  transferred_by_user_id uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  constraint platform_sales_rep_portfolio_transfers_distinct_reps check (
    from_sales_rep_id <> to_sales_rep_id
  )
);

create index platform_sales_rep_portfolio_transfers_from_idx
  on public.platform_sales_rep_portfolio_transfers (from_sales_rep_id, effective_at desc);

comment on table public.platform_sales_rep_portfolio_transfers is
  'Audit log when commercial portfolio moves from one rep to another.';

-- ---------------------------------------------------------------------------
-- platform_commission_rules
-- ---------------------------------------------------------------------------

create table public.platform_commission_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  applies_to_plan_key text,
  calculation_type text not null,
  rate_bps integer,
  fixed_amount_cents integer,
  mrr_months integer,
  valid_from date not null default current_date,
  valid_until date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_commission_rules_calculation_type_check check (
    calculation_type in ('percent_mrr_recurring', 'percent_first_invoice', 'fixed_setup')
  )
);

comment on table public.platform_commission_rules is
  'Versioned commission rules; percent_mrr_recurring is the default for squad v1.';

-- ---------------------------------------------------------------------------
-- platform_commission_ledger_entries
-- ---------------------------------------------------------------------------

create table public.platform_commission_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  sales_rep_id uuid not null references public.platform_sales_reps (id) on delete restrict,
  attribution_id uuid references public.platform_sales_rep_dealership_attributions (id) on delete set null,
  campaign_id uuid,
  entry_type text not null,
  amount_cents integer not null,
  currency text not null default 'BRL',
  description text not null,
  reference_month date not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_commission_ledger_entries_entry_type_check check (
    entry_type in ('commission', 'bonus', 'adjustment', 'clawback')
  ),
  constraint platform_commission_ledger_entries_status_check check (
    status in ('pending', 'approved', 'paid', 'cancelled')
  )
);

create index platform_commission_ledger_entries_rep_month_idx
  on public.platform_commission_ledger_entries (sales_rep_id, reference_month desc);

create index platform_commission_ledger_entries_status_idx
  on public.platform_commission_ledger_entries (status, reference_month desc);

comment on table public.platform_commission_ledger_entries is
  'Immutable-style commission lines per rep and competence month.';

-- ---------------------------------------------------------------------------
-- platform_incentive_campaigns
-- ---------------------------------------------------------------------------

create table public.platform_incentive_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  goal_metric text not null,
  goal_target integer not null,
  bonus_amount_cents integer not null,
  eligible_rep_ids uuid[],
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_incentive_campaigns_goal_metric_check check (
    goal_metric in ('closed_dealerships', 'mrr_total_cents', 'setup_count')
  ),
  constraint platform_incentive_campaigns_status_check check (
    status in ('draft', 'active', 'closed')
  ),
  constraint platform_incentive_campaigns_goal_target_check check (goal_target > 0),
  constraint platform_incentive_campaigns_bonus_check check (bonus_amount_cents > 0)
);

comment on table public.platform_incentive_campaigns is
  'Temporary incentive campaigns for the commercial squad.';

alter table public.platform_commission_ledger_entries
  add constraint platform_commission_ledger_entries_campaign_id_fkey
  foreign key (campaign_id) references public.platform_incentive_campaigns (id) on delete set null;

-- ---------------------------------------------------------------------------
-- platform_payout_batches + items
-- ---------------------------------------------------------------------------

create table public.platform_payout_batches (
  id uuid primary key default gen_random_uuid(),
  reference_month date not null,
  payment_date date not null,
  status text not null default 'draft',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_payout_batches_status_check check (
    status in ('draft', 'processing', 'paid')
  )
);

create index platform_payout_batches_reference_month_idx
  on public.platform_payout_batches (reference_month desc);

create table public.platform_payout_batch_items (
  id uuid primary key default gen_random_uuid(),
  payout_batch_id uuid not null references public.platform_payout_batches (id) on delete cascade,
  ledger_entry_id uuid not null references public.platform_commission_ledger_entries (id) on delete restrict,
  sales_rep_id uuid not null references public.platform_sales_reps (id) on delete restrict,
  amount_cents integer not null,
  bank_account_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint platform_payout_batch_items_ledger_entry_key unique (ledger_entry_id)
);

comment on table public.platform_payout_batches is
  'Grouped payout runs for commercial squad (typically payment on day 10).';

-- ---------------------------------------------------------------------------
-- helpers: sales rep identity (portal v1) — after tables exist
-- ---------------------------------------------------------------------------

create or replace function public.current_platform_sales_rep_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select r.id
  from public.platform_sales_reps as r
  where r.user_id = (select auth.uid())
    and r.status = 'active'
  limit 1;
$$;

comment on function public.current_platform_sales_rep_id() is
  'Returns active platform sales rep id for the authenticated user, or null.';

create or replace function public.is_platform_sales_rep()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select (select public.current_platform_sales_rep_id()) is not null;
$$;

comment on function public.is_platform_sales_rep() is
  'True when the authenticated user is linked to an active platform sales rep.';

-- ---------------------------------------------------------------------------
-- row level security
-- ---------------------------------------------------------------------------

alter table public.platform_sales_reps enable row level security;
alter table public.platform_sales_rep_bank_accounts enable row level security;
alter table public.platform_sales_rep_dealership_attributions enable row level security;
alter table public.platform_sales_rep_portfolio_transfers enable row level security;
alter table public.platform_commission_rules enable row level security;
alter table public.platform_commission_ledger_entries enable row level security;
alter table public.platform_incentive_campaigns enable row level security;
alter table public.platform_payout_batches enable row level security;
alter table public.platform_payout_batch_items enable row level security;

-- super_admin: full platform commercial access
create policy "platform_sales_reps_select_super_admin"
on public.platform_sales_reps for select to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_sales_reps_insert_super_admin"
on public.platform_sales_reps for insert to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_sales_reps_update_super_admin"
on public.platform_sales_reps for update to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "platform_sales_reps_select_own_rep"
on public.platform_sales_reps for select to authenticated
using (id = (select public.current_platform_sales_rep_id()));

create policy "platform_sales_rep_bank_accounts_select_super_admin"
on public.platform_sales_rep_bank_accounts for select to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_sales_rep_bank_accounts_insert_super_admin"
on public.platform_sales_rep_bank_accounts for insert to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_sales_rep_bank_accounts_update_super_admin"
on public.platform_sales_rep_bank_accounts for update to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "platform_sales_rep_bank_accounts_select_own_rep"
on public.platform_sales_rep_bank_accounts for select to authenticated
using (sales_rep_id = (select public.current_platform_sales_rep_id()));

create policy "platform_sales_rep_bank_accounts_insert_own_rep"
on public.platform_sales_rep_bank_accounts for insert to authenticated
with check (sales_rep_id = (select public.current_platform_sales_rep_id()));

create policy "platform_sales_rep_bank_accounts_update_own_rep"
on public.platform_sales_rep_bank_accounts for update to authenticated
using (sales_rep_id = (select public.current_platform_sales_rep_id()))
with check (sales_rep_id = (select public.current_platform_sales_rep_id()));

create policy "platform_sales_rep_dealership_attributions_select_super_admin"
on public.platform_sales_rep_dealership_attributions for select to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_sales_rep_dealership_attributions_insert_super_admin"
on public.platform_sales_rep_dealership_attributions for insert to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_sales_rep_dealership_attributions_update_super_admin"
on public.platform_sales_rep_dealership_attributions for update to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "platform_sales_rep_dealership_attributions_select_own_rep"
on public.platform_sales_rep_dealership_attributions for select to authenticated
using (
  sales_rep_id = (select public.current_platform_sales_rep_id())
  and status in ('confirmed', 'pending')
);

create policy "platform_sales_rep_portfolio_transfers_select_super_admin"
on public.platform_sales_rep_portfolio_transfers for select to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_sales_rep_portfolio_transfers_insert_super_admin"
on public.platform_sales_rep_portfolio_transfers for insert to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_commission_rules_select_super_admin"
on public.platform_commission_rules for select to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_commission_rules_insert_super_admin"
on public.platform_commission_rules for insert to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_commission_rules_update_super_admin"
on public.platform_commission_rules for update to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "platform_commission_ledger_entries_select_super_admin"
on public.platform_commission_ledger_entries for select to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_commission_ledger_entries_insert_super_admin"
on public.platform_commission_ledger_entries for insert to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_commission_ledger_entries_update_super_admin"
on public.platform_commission_ledger_entries for update to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "platform_commission_ledger_entries_select_own_rep"
on public.platform_commission_ledger_entries for select to authenticated
using (sales_rep_id = (select public.current_platform_sales_rep_id()));

create policy "platform_incentive_campaigns_select_super_admin"
on public.platform_incentive_campaigns for select to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_incentive_campaigns_insert_super_admin"
on public.platform_incentive_campaigns for insert to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_incentive_campaigns_update_super_admin"
on public.platform_incentive_campaigns for update to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "platform_payout_batches_select_super_admin"
on public.platform_payout_batches for select to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_payout_batches_insert_super_admin"
on public.platform_payout_batches for insert to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_payout_batches_update_super_admin"
on public.platform_payout_batches for update to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "platform_payout_batch_items_select_super_admin"
on public.platform_payout_batch_items for select to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_payout_batch_items_insert_super_admin"
on public.platform_payout_batch_items for insert to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_payout_batch_items_update_super_admin"
on public.platform_payout_batch_items for update to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

-- ---------------------------------------------------------------------------
-- rpc: transfer portfolio
-- ---------------------------------------------------------------------------

create or replace function public.transfer_sales_rep_portfolio(
  p_from_sales_rep_id uuid,
  p_to_sales_rep_id uuid,
  p_effective_at timestamptz,
  p_dealership_ids uuid[] default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moved integer := 0;
  v_transfer_id uuid;
begin
  if not (select public.is_platform_super_admin()) then
    raise exception 'forbidden';
  end if;

  if p_from_sales_rep_id = p_to_sales_rep_id then
    raise exception 'source and destination rep must differ';
  end if;

  if not exists (
    select 1 from public.platform_sales_reps as r
    where r.id = p_to_sales_rep_id and r.status = 'active'
  ) then
    raise exception 'destination rep must be active';
  end if;

  insert into public.platform_sales_rep_portfolio_transfers (
    from_sales_rep_id,
    to_sales_rep_id,
    effective_at,
    dealership_ids,
    transferred_by_user_id,
    notes
  )
  values (
    p_from_sales_rep_id,
    p_to_sales_rep_id,
    p_effective_at,
    p_dealership_ids,
    (select auth.uid()),
    p_notes
  )
  returning id into v_transfer_id;

  update public.platform_sales_rep_dealership_attributions as a
  set
    sales_rep_id = p_to_sales_rep_id,
    updated_at = now()
  where a.sales_rep_id = p_from_sales_rep_id
    and a.status = 'confirmed'
    and (
      p_dealership_ids is null
      or a.dealership_id = any (p_dealership_ids)
    );

  get diagnostics v_moved = row_count;

  return jsonb_build_object(
    'transfer_id', v_transfer_id,
    'dealerships_moved', v_moved
  );
end;
$$;

comment on function public.transfer_sales_rep_portfolio(uuid, uuid, timestamptz, uuid[], text) is
  'Moves confirmed attributions from one sales rep to another; super_admin only.';

revoke all on function public.transfer_sales_rep_portfolio(uuid, uuid, timestamptz, uuid[], text) from public;
grant execute on function public.transfer_sales_rep_portfolio(uuid, uuid, timestamptz, uuid[], text) to authenticated;

-- ---------------------------------------------------------------------------
-- rpc: confirm attribution + initial ledger stub
-- ---------------------------------------------------------------------------

create or replace function public.confirm_dealership_sales_attribution(
  p_attribution_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_att public.platform_sales_rep_dealership_attributions%rowtype;
  v_amount_cents integer;
  v_ledger_id uuid;
  v_rate_bps integer;
begin
  if not (select public.is_platform_super_admin()) then
    raise exception 'forbidden';
  end if;

  select * into v_att
  from public.platform_sales_rep_dealership_attributions as a
  where a.id = p_attribution_id
  for update;

  if not found then
    raise exception 'attribution not found';
  end if;

  if v_att.status = 'confirmed' then
    return null;
  end if;

  update public.platform_sales_rep_dealership_attributions
  set status = 'confirmed', updated_at = now()
  where id = p_attribution_id;

  select r.default_commission_rate_bps into v_rate_bps
  from public.platform_sales_reps as r
  where r.id = v_att.sales_rep_id;

  v_amount_cents := coalesce(
    round(
      coalesce(v_att.first_invoice_amount_cents, 0)::numeric
      * v_rate_bps::numeric
      * v_att.attribution_share_bps::numeric
      / 100000000
    )::integer,
    0
  );

  if v_amount_cents <> 0 then
    insert into public.platform_commission_ledger_entries (
      sales_rep_id,
      attribution_id,
      entry_type,
      amount_cents,
      description,
      reference_month,
      status
    )
    values (
      v_att.sales_rep_id,
      v_att.id,
      'commission',
      v_amount_cents,
      'Comissão recorrente — competência inicial',
      date_trunc('month', v_att.closed_at)::date,
      'pending'
    )
    returning id into v_ledger_id;
  end if;

  return v_ledger_id;
end;
$$;

comment on function public.confirm_dealership_sales_attribution(uuid) is
  'Confirms rep↔dealership attribution and creates first pending commission line when amount > 0.';

revoke all on function public.confirm_dealership_sales_attribution(uuid) from public;
grant execute on function public.confirm_dealership_sales_attribution(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- rpc: clawback on churn within 30 days
-- ---------------------------------------------------------------------------

create or replace function public.clawback_dealership_sales_commissions(
  p_dealership_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_closed_at timestamptz;
  v_rows integer := 0;
  r record;
begin
  if not (select public.is_platform_super_admin()) then
    raise exception 'forbidden';
  end if;

  select min(a.closed_at) into v_closed_at
  from public.platform_sales_rep_dealership_attributions as a
  where a.dealership_id = p_dealership_id
    and a.status = 'confirmed';

  if v_closed_at is null then
    return 0;
  end if;

  if (select d.status from public.dealerships as d where d.id = p_dealership_id) <> 'churned' then
    return 0;
  end if;

  if now() > v_closed_at + interval '30 days' then
    return 0;
  end if;

  for r in
    select
      e.id,
      e.sales_rep_id,
      e.amount_cents,
      e.reference_month,
      e.attribution_id
    from public.platform_commission_ledger_entries as e
    inner join public.platform_sales_rep_dealership_attributions as a
      on a.id = e.attribution_id
    where a.dealership_id = p_dealership_id
      and e.entry_type = 'commission'
      and e.status in ('pending', 'approved', 'paid')
      and not exists (
        select 1
        from public.platform_commission_ledger_entries as c
        where c.attribution_id = e.attribution_id
          and c.entry_type = 'clawback'
          and c.reference_month = e.reference_month
      )
  loop
    insert into public.platform_commission_ledger_entries (
      sales_rep_id,
      attribution_id,
      entry_type,
      amount_cents,
      description,
      reference_month,
      status
    )
    values (
      r.sales_rep_id,
      r.attribution_id,
      'clawback',
      -abs(r.amount_cents),
      'Estorno — cancelamento em 30 dias',
      r.reference_month,
      'pending'
    );

    v_rows := v_rows + 1;
  end loop;

  update public.platform_sales_rep_dealership_attributions
  set status = 'cancelled', updated_at = now()
  where dealership_id = p_dealership_id
    and status = 'confirmed';

  return v_rows;
end;
$$;

comment on function public.clawback_dealership_sales_commissions(uuid) is
  'Creates clawback ledger lines when dealership churned within 30 days of close; super_admin or job.';

revoke all on function public.clawback_dealership_sales_commissions(uuid) from public;
grant execute on function public.clawback_dealership_sales_commissions(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- rpc: approve ledger entries (finance)
-- ---------------------------------------------------------------------------

create or replace function public.approve_sales_commission_ledger_entries(
  p_entry_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not (select public.is_platform_super_admin()) then
    raise exception 'forbidden';
  end if;

  update public.platform_commission_ledger_entries
  set status = 'approved', updated_at = now()
  where id = any (p_entry_ids)
    and status = 'pending';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.approve_sales_commission_ledger_entries(uuid[]) is
  'Bulk-approves pending commission ledger entries; super_admin only.';

revoke all on function public.approve_sales_commission_ledger_entries(uuid[]) from public;
grant execute on function public.approve_sales_commission_ledger_entries(uuid[]) to authenticated;

-- default recurring commission rule seed
insert into public.platform_commission_rules (
  name,
  calculation_type,
  rate_bps,
  is_active
)
select
  'Comissão recorrente padrão 2026',
  'percent_mrr_recurring',
  1000,
  true
where not exists (
  select 1 from public.platform_commission_rules where name = 'Comissão recorrente padrão 2026'
);
