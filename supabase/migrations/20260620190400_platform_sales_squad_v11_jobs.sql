/*
  migration: platform sales squad v1.1 — monthly ledger, payout batches, contract attribution
  purpose:
    - generate recurring commission lines per competence month
    - group approved lines into payout batches (payment day 10)
    - mark batches paid and provision attribution from signed contracts
  affected:
    - rpc: generate_monthly_commission_ledger, generate_payout_batch, mark_payout_batch_paid
    - rpc: provision_attribution_from_signed_contract
*/

create or replace function public.generate_monthly_commission_ledger(
  p_reference_month date default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month date;
  v_inserted integer := 0;
  v_att record;
  v_amount_cents integer;
  v_rate_bps integer;
begin
  if coalesce((select auth.jwt()) ->> 'role', '') <> 'service_role'
    and not (select public.is_platform_super_admin()) then
    raise exception 'forbidden';
  end if;

  v_month := coalesce(
    p_reference_month,
    date_trunc('month', (current_date - interval '1 month'))::date
  );

  for v_att in
    select
      a.id as attribution_id,
      a.sales_rep_id,
      a.dealership_id,
      a.attribution_share_bps,
      a.first_invoice_amount_cents,
      r.default_commission_rate_bps
    from public.platform_sales_rep_dealership_attributions as a
    inner join public.platform_sales_reps as r on r.id = a.sales_rep_id
    inner join public.dealerships as d on d.id = a.dealership_id
    where a.status = 'confirmed'
      and d.status = 'active'
      and coalesce(a.first_invoice_amount_cents, 0) > 0
      and not exists (
        select 1
        from public.platform_commission_ledger_entries as e
        where e.attribution_id = a.id
          and e.entry_type = 'commission'
          and e.reference_month = v_month
          and e.status <> 'cancelled'
      )
  loop
    v_rate_bps := v_att.default_commission_rate_bps;
    v_amount_cents := round(
      v_att.first_invoice_amount_cents::numeric
      * v_rate_bps::numeric
      * v_att.attribution_share_bps::numeric
      / 100000000
    )::integer;

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
        v_att.attribution_id,
        'commission',
        v_amount_cents,
        'Comissão recorrente — competência ' || to_char(v_month, 'MM/YYYY'),
        v_month,
        'pending'
      );
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'reference_month', v_month,
    'entries_created', v_inserted
  );
end;
$$;

comment on function public.generate_monthly_commission_ledger(date) is
  'Creates pending commission lines for confirmed active attributions missing the competence month.';

revoke all on function public.generate_monthly_commission_ledger(date) from public;
grant execute on function public.generate_monthly_commission_ledger(date) to authenticated;

create or replace function public.generate_payout_batch(
  p_reference_month date,
  p_payment_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch_id uuid;
  v_payment date;
  v_entry record;
  v_bank jsonb;
begin
  if coalesce((select auth.jwt()) ->> 'role', '') <> 'service_role'
    and not (select public.is_platform_super_admin()) then
    raise exception 'forbidden';
  end if;

  if p_reference_month is null then
    raise exception 'reference_month required';
  end if;

  v_payment := coalesce(
    p_payment_date,
    (date_trunc('month', current_date)::date + interval '9 days')::date
  );

  if exists (
    select 1
    from public.platform_payout_batches as b
    where b.reference_month = p_reference_month
      and b.status in ('draft', 'processing')
  ) then
    raise exception 'open payout batch already exists for this month';
  end if;

  insert into public.platform_payout_batches (
    reference_month,
    payment_date,
    status,
    created_by
  )
  values (
    p_reference_month,
    v_payment,
    'draft',
    (select auth.uid())
  )
  returning id into v_batch_id;

  for v_entry in
    select e.id, e.sales_rep_id, e.amount_cents
    from public.platform_commission_ledger_entries as e
    where e.reference_month = p_reference_month
      and e.status = 'approved'
      and not exists (
        select 1
        from public.platform_payout_batch_items as i
        where i.ledger_entry_id = e.id
      )
  loop
    select jsonb_build_object(
      'payment_method', ba.payment_method,
      'pix_key_type', ba.pix_key_type,
      'pix_key', ba.pix_key,
      'bank_code', ba.bank_code,
      'branch', ba.branch,
      'account_number', ba.account_number,
      'account_holder_name', ba.account_holder_name,
      'account_holder_document', ba.account_holder_document
    )
    into v_bank
    from public.platform_sales_rep_bank_accounts as ba
    where ba.sales_rep_id = v_entry.sales_rep_id
      and ba.is_primary = true
    order by ba.valid_from desc
    limit 1;

    insert into public.platform_payout_batch_items (
      payout_batch_id,
      ledger_entry_id,
      sales_rep_id,
      amount_cents,
      bank_account_snapshot
    )
    values (
      v_batch_id,
      v_entry.id,
      v_entry.sales_rep_id,
      v_entry.amount_cents,
      coalesce(v_bank, '{}'::jsonb)
    );
  end loop;

  return v_batch_id;
end;
$$;

comment on function public.generate_payout_batch(date, date) is
  'Groups approved ledger lines into a draft payout batch with bank snapshots.';

revoke all on function public.generate_payout_batch(date, date) from public;
grant execute on function public.generate_payout_batch(date, date) to authenticated;

create or replace function public.mark_payout_batch_paid(
  p_payout_batch_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_items integer := 0;
begin
  if coalesce((select auth.jwt()) ->> 'role', '') <> 'service_role'
    and not (select public.is_platform_super_admin()) then
    raise exception 'forbidden';
  end if;

  update public.platform_payout_batches
  set status = 'paid', updated_at = now()
  where id = p_payout_batch_id
    and status in ('draft', 'processing');

  if not found then
    raise exception 'payout batch not found or already paid';
  end if;

  update public.platform_commission_ledger_entries as e
  set status = 'paid', updated_at = now()
  from public.platform_payout_batch_items as i
  where i.payout_batch_id = p_payout_batch_id
    and i.ledger_entry_id = e.id
    and e.status = 'approved';

  get diagnostics v_items = row_count;

  return jsonb_build_object(
    'payout_batch_id', p_payout_batch_id,
    'ledger_entries_marked_paid', v_items
  );
end;
$$;

comment on function public.mark_payout_batch_paid(uuid) is
  'Marks a payout batch paid and updates linked approved ledger entries to paid.';

revoke all on function public.mark_payout_batch_paid(uuid) from public;
grant execute on function public.mark_payout_batch_paid(uuid) to authenticated;

create or replace function public.provision_attribution_from_signed_contract(
  p_contract_id uuid,
  p_sales_rep_id uuid,
  p_dealership_id uuid default null,
  p_confirm_immediately boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contract public.platform_contracts%rowtype;
  v_dealership_id uuid;
  v_amount_cents integer;
  v_attribution_id uuid;
  v_ledger_id uuid;
begin
  if not (select public.is_platform_super_admin()) then
    raise exception 'forbidden';
  end if;

  select * into v_contract
  from public.platform_contracts as c
  where c.id = p_contract_id;

  if not found then
    raise exception 'contract not found';
  end if;

  if v_contract.status <> 'signed' then
    raise exception 'contract must be signed';
  end if;

  v_dealership_id := coalesce(p_dealership_id, v_contract.dealership_id);
  if v_dealership_id is null then
    raise exception 'dealership required';
  end if;

  if not exists (
    select 1 from public.platform_sales_reps as r where r.id = p_sales_rep_id
  ) then
    raise exception 'sales rep not found';
  end if;

  if exists (
    select 1
    from public.platform_sales_rep_dealership_attributions as a
    where a.contract_id = p_contract_id
      and a.status <> 'cancelled'
  ) then
    select a.id into v_attribution_id
    from public.platform_sales_rep_dealership_attributions as a
    where a.contract_id = p_contract_id
      and a.status <> 'cancelled'
    limit 1;
    return v_attribution_id;
  end if;

  v_amount_cents := round(coalesce(v_contract.monthly_amount, 0) * 100)::integer;

  insert into public.platform_sales_rep_dealership_attributions (
    sales_rep_id,
    dealership_id,
    saas_prospect_id,
    contract_id,
    attribution_type,
    attribution_share_bps,
    closed_at,
    first_invoice_amount_cents,
    plan_key,
    status
  )
  values (
    p_sales_rep_id,
    v_dealership_id,
    v_contract.saas_prospect_id,
    p_contract_id,
    'closer',
    10000,
    coalesce(v_contract.signed_at, now()),
    nullif(v_amount_cents, 0),
    v_contract.plan_name,
    'pending'
  )
  returning id into v_attribution_id;

  if p_dealership_id is not null and v_contract.dealership_id is distinct from p_dealership_id then
    update public.platform_contracts
    set dealership_id = p_dealership_id, updated_at = now()
    where id = p_contract_id;
  end if;

  if p_confirm_immediately then
    v_ledger_id := public.confirm_dealership_sales_attribution(v_attribution_id);
  end if;

  return v_attribution_id;
end;
$$;

comment on function public.provision_attribution_from_signed_contract(uuid, uuid, uuid, boolean) is
  'Creates (and optionally confirms) rep attribution when a platform contract is signed.';

revoke all on function public.provision_attribution_from_signed_contract(uuid, uuid, uuid, boolean) from public;
grant execute on function public.provision_attribution_from_signed_contract(uuid, uuid, uuid, boolean) to authenticated;
