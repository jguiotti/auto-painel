-- migration: growth operations — stock limits, support requests, admin notifications, contract opt-in, aging metrics
-- purpose:
--   - enforce pricing plan vehicle caps (10 / 30 / unlimited)
--   - persist upgrade/support requests with SLA
--   - platform admin notification inbox
--   - contract opt-in flow (replace e-signature statuses)
--   - inventory aging metrics RPC (advanced_metrics gate)
-- affected: pricing_plans, vehicles, platform_contracts, new platform_* tables

-- ---------------------------------------------------------------------------
-- pricing_plans: max active available vehicles per plan
-- ---------------------------------------------------------------------------

alter table public.pricing_plans
  add column if not exists max_active_vehicles integer;

comment on column public.pricing_plans.max_active_vehicles is
  'Cap for vehicles with status=available and is_active=true. NULL = no cap (Completo).';

update public.pricing_plans
set max_active_vehicles = 10
where slug in ('starter', 'trial');

update public.pricing_plans
set max_active_vehicles = 30
where slug = 'business';

update public.pricing_plans
set max_active_vehicles = null
where slug = 'enterprise';

-- ---------------------------------------------------------------------------
-- vehicles: available_since for aging metrics
-- ---------------------------------------------------------------------------

alter table public.vehicles
  add column if not exists available_since timestamptz;

comment on column public.vehicles.available_since is
  'Timestamp when vehicle last became available and active for sale (aging metrics).';

update public.vehicles as v
set available_since = v.created_at
where v.status = 'available'
  and v.is_active = true
  and v.available_since is null;

create or replace function private.sync_vehicle_available_since()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'available' and new.is_active = true then
    if tg_op = 'INSERT'
      or old.status is distinct from new.status
      or old.is_active is distinct from new.is_active
    then
      new.available_since := now();
    end if;
  else
    new.available_since := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_vehicles_sync_available_since on public.vehicles;
create trigger trg_vehicles_sync_available_since
before insert or update of status, is_active on public.vehicles
for each row
execute function private.sync_vehicle_available_since();

-- ---------------------------------------------------------------------------
-- stock limit helpers
-- ---------------------------------------------------------------------------

create or replace function private.count_dealership_eligible_stock_vehicles(
  p_dealership_id uuid,
  p_exclude_vehicle_id uuid default null
)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)::integer
  from public.vehicles as v
  where v.dealership_id = p_dealership_id
    and v.status = 'available'
    and v.is_active = true
    and (p_exclude_vehicle_id is null or v.id <> p_exclude_vehicle_id);
$$;

create or replace function private.stock_limit_for_dealership(p_dealership_id uuid)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select pp.max_active_vehicles
  from public.dealerships as d
  left join public.pricing_plans as pp on pp.id = d.pricing_plan_id
  where d.id = p_dealership_id;
$$;

create or replace function private.suggested_upgrade_plan_slug(p_current_slug text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select case p_current_slug
    when 'starter' then 'business'
    when 'trial' then 'business'
    when 'business' then 'enterprise'
    else null
  end;
$$;

create or replace function public.get_dealership_stock_limit_status(
  p_dealership_id uuid default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_dealership_id uuid;
  v_plan_slug text;
  v_plan_name text;
  v_limit integer;
  v_count integer;
  v_upgrade_slug text;
  v_upgrade_name text;
begin
  select p.dealership_id
  into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if p_dealership_id is not null then
    if v_dealership_id is null or v_dealership_id <> p_dealership_id then
      raise exception 'unauthorized';
    end if;
    v_dealership_id := p_dealership_id;
  end if;

  if v_dealership_id is null then
    raise exception 'unauthorized';
  end if;

  select pp.slug, pp.name, pp.max_active_vehicles
  into v_plan_slug, v_plan_name, v_limit
  from public.dealerships as d
  left join public.pricing_plans as pp on pp.id = d.pricing_plan_id
  where d.id = v_dealership_id;

  v_count := private.count_dealership_eligible_stock_vehicles(v_dealership_id, null);
  v_upgrade_slug := private.suggested_upgrade_plan_slug(v_plan_slug);

  if v_upgrade_slug is not null then
    select up.name
    into v_upgrade_name
    from public.pricing_plans as up
    where up.slug = v_upgrade_slug;
  end if;

  return jsonb_build_object(
    'eligible_count', v_count,
    'max_active_vehicles', v_limit,
    'plan_slug', v_plan_slug,
    'plan_name', v_plan_name,
    'suggested_upgrade_slug', v_upgrade_slug,
    'suggested_upgrade_name', v_upgrade_name,
    'at_limit', v_limit is not null and v_count >= v_limit,
    'near_limit', v_limit is not null and v_count >= greatest(v_limit - 2, 1),
    'warning_ratio', case when v_limit is null or v_limit = 0 then 0
      else round(v_count::numeric / v_limit::numeric, 4) end
  );
end;
$$;

comment on function public.get_dealership_stock_limit_status(uuid) is
  'Tenant-scoped stock cap status for dealership-panel upgrade UX.';

revoke all on function public.get_dealership_stock_limit_status(uuid) from public;
grant execute on function public.get_dealership_stock_limit_status(uuid) to authenticated;

create or replace function private.enforce_dealership_stock_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_limit integer;
  v_count integer;
begin
  if new.status = 'available' and new.is_active = true then
    v_limit := private.stock_limit_for_dealership(new.dealership_id);

    if v_limit is not null then
      v_count := private.count_dealership_eligible_stock_vehicles(
        new.dealership_id,
        case when tg_op = 'UPDATE' then old.id else null end
      );

      if v_count >= v_limit then
        raise exception 'stock_limit_reached'
          using hint = 'Plan vehicle cap reached; request plan upgrade.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_vehicles_enforce_stock_limit on public.vehicles;
create trigger trg_vehicles_enforce_stock_limit
before insert or update of status, is_active on public.vehicles
for each row
execute function private.enforce_dealership_stock_limit();

-- ---------------------------------------------------------------------------
-- platform admin notifications
-- ---------------------------------------------------------------------------

create table if not exists public.platform_admin_notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  target_path text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint platform_admin_notifications_kind_check check (
    kind in (
      'commercial_lead_new',
      'trial_onboarding_new',
      'plan_upgrade_request',
      'technical_support_request',
      'contract_sent_for_acceptance',
      'contract_accepted',
      'contract_declined',
      'cancellation_request',
      'billing_due_7',
      'billing_due_3',
      'billing_due_today',
      'billing_overdue'
    )
  )
);

comment on table public.platform_admin_notifications is
  'Operator inbox for admin-master super_admin — leads, trials, upgrades, billing.';

create index if not exists platform_admin_notifications_unread_idx
  on public.platform_admin_notifications (read_at, created_at desc);

alter table public.platform_admin_notifications enable row level security;

create policy "platform_admin_notifications_select_super_admin"
on public.platform_admin_notifications
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_admin_notifications_update_super_admin"
on public.platform_admin_notifications
for update
to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create or replace function private.insert_platform_admin_notification(
  p_kind text,
  p_title text,
  p_body text,
  p_payload jsonb default '{}'::jsonb,
  p_target_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.platform_admin_notifications (
    kind,
    title,
    body,
    payload,
    target_path
  )
  values (
    p_kind,
    p_title,
    p_body,
    coalesce(p_payload, '{}'::jsonb),
    p_target_path
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function private.insert_platform_admin_notification(text, text, text, jsonb, text) from public;

create or replace function public.list_platform_admin_notifications(
  p_unread_only boolean default false,
  p_limit integer default 50,
  p_offset integer default 0
)
returns setof public.platform_admin_notifications
language sql
stable
security invoker
set search_path = ''
as $$
  select n.*
  from public.platform_admin_notifications as n
  where (select public.is_platform_super_admin())
    and (
      not coalesce(p_unread_only, false)
      or n.read_at is null
    )
  order by n.created_at desc
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.list_platform_admin_notifications(boolean, integer, integer) from public;
grant execute on function public.list_platform_admin_notifications(boolean, integer, integer) to authenticated;

create or replace function public.mark_platform_admin_notification_read(p_notification_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select public.is_platform_super_admin()) then
    raise exception 'unauthorized';
  end if;

  update public.platform_admin_notifications as n
  set read_at = coalesce(n.read_at, now())
  where n.id = p_notification_id;
end;
$$;

revoke all on function public.mark_platform_admin_notification_read(uuid) from public;
grant execute on function public.mark_platform_admin_notification_read(uuid) to authenticated;

create or replace function public.mark_all_platform_admin_notifications_read()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not (select public.is_platform_super_admin()) then
    raise exception 'unauthorized';
  end if;

  update public.platform_admin_notifications as n
  set read_at = now()
  where n.read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.mark_all_platform_admin_notifications_read() from public;
grant execute on function public.mark_all_platform_admin_notifications_read() to authenticated;

-- ---------------------------------------------------------------------------
-- dealership support / upgrade requests
-- ---------------------------------------------------------------------------

create table if not exists public.dealership_support_requests (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  request_type text not null,
  message text,
  current_plan_slug text,
  desired_plan_slug text,
  eligible_vehicle_count integer,
  status text not null default 'open',
  sla_due_at timestamptz not null,
  whatsapp_opened_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dealership_support_requests_type_check check (
    request_type in ('plan_upgrade', 'technical_support', 'other')
  ),
  constraint dealership_support_requests_status_check check (
    status in ('open', 'in_progress', 'done')
  )
);

comment on table public.dealership_support_requests is
  'Upgrade and support requests from dealership-panel; SLA 1 business day.';

create index if not exists dealership_support_requests_open_idx
  on public.dealership_support_requests (status, sla_due_at, created_at desc);

create index if not exists dealership_support_requests_dealership_idx
  on public.dealership_support_requests (dealership_id, created_at desc);

alter table public.dealership_support_requests enable row level security;

create policy "dealership_support_requests_select_tenant"
on public.dealership_support_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and (
        p.role = 'super_admin'
        or p.dealership_id = dealership_support_requests.dealership_id
      )
  )
);

create policy "dealership_support_requests_insert_leader"
on public.dealership_support_requests
for insert
to authenticated
with check (
  private.is_dealership_leader_for(dealership_id)
);

create policy "dealership_support_requests_update_super_admin"
on public.dealership_support_requests
for update
to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

drop trigger if exists trg_dealership_support_requests_updated_at on public.dealership_support_requests;
create trigger trg_dealership_support_requests_updated_at
before update on public.dealership_support_requests
for each row
execute function public.set_updated_at_timestamp();

create or replace function private.notify_support_request_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dealership_name text;
  v_kind text;
  v_title text;
  v_body text;
begin
  select d.name
  into v_dealership_name
  from public.dealerships as d
  where d.id = new.dealership_id;

  if new.request_type = 'plan_upgrade' then
    v_kind := 'plan_upgrade_request';
    v_title := 'Pedido de upgrade de plano';
    v_body := format(
      '%s — %s → %s. Responder em 1 dia útil.',
      coalesce(v_dealership_name, 'Loja'),
      coalesce(new.current_plan_slug, '?'),
      coalesce(new.desired_plan_slug, '?')
    );
  else
    v_kind := 'technical_support_request';
    v_title := 'Suporte técnico (painel da loja)';
    v_body := format(
      '%s — %s. Responder em 1 dia útil.',
      coalesce(v_dealership_name, 'Loja'),
      coalesce(left(new.message, 120), 'Sem descrição')
    );
  end if;

  perform private.insert_platform_admin_notification(
    v_kind,
    v_title,
    v_body,
    jsonb_build_object(
      'dealership_id', new.dealership_id,
      'request_id', new.id,
      'request_type', new.request_type
    ),
    '/painel/solicitacoes-upgrade'
  );

  return new;
end;
$$;

drop trigger if exists trg_dealership_support_requests_notify on public.dealership_support_requests;
create trigger trg_dealership_support_requests_notify
after insert on public.dealership_support_requests
for each row
execute function private.notify_support_request_created();

create or replace function public.create_dealership_support_request(
  p_request_type text,
  p_message text default null,
  p_desired_plan_slug text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dealership_id uuid;
  v_plan_slug text;
  v_count integer;
  v_id uuid;
  v_sla timestamptz;
begin
  select p.dealership_id
  into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_dealership_id is null or not private.is_dealership_leader_for(v_dealership_id) then
    raise exception 'unauthorized';
  end if;

  if p_request_type not in ('plan_upgrade', 'technical_support', 'other') then
    raise exception 'invalid_request_type';
  end if;

  select pp.slug
  into v_plan_slug
  from public.dealerships as d
  left join public.pricing_plans as pp on pp.id = d.pricing_plan_id
  where d.id = v_dealership_id;

  v_count := private.count_dealership_eligible_stock_vehicles(v_dealership_id, null);
  v_sla := now() + interval '1 day';

  insert into public.dealership_support_requests (
    dealership_id,
    request_type,
    message,
    current_plan_slug,
    desired_plan_slug,
    eligible_vehicle_count,
    sla_due_at,
    metadata,
    created_by
  )
  values (
    v_dealership_id,
    p_request_type,
    nullif(trim(p_message), ''),
    v_plan_slug,
    nullif(trim(p_desired_plan_slug), ''),
    v_count,
    v_sla,
    coalesce(p_metadata, '{}'::jsonb),
    (select auth.uid())
  )
  returning id into v_id;

  return jsonb_build_object(
    'request_id', v_id,
    'sla_due_at', v_sla
  );
end;
$$;

comment on function public.create_dealership_support_request(text, text, text, jsonb) is
  'Dealership leader creates upgrade/support request; notifies platform admin.';

revoke all on function public.create_dealership_support_request(text, text, text, jsonb) from public;
grant execute on function public.create_dealership_support_request(text, text, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- inventory aging metrics (advanced_metrics gate)
-- ---------------------------------------------------------------------------

create or replace function public.get_dealership_inventory_aging_metrics(
  p_dealership_id uuid default null,
  p_attention_threshold_days integer default 45,
  p_leads_window_days integer default 30
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_dealership_id uuid;
  v_keys text[];
  v_threshold integer;
  v_window integer;
  v_capital numeric;
  v_avg_days numeric;
  v_aged_pct numeric;
  v_daily_rate numeric := 0.0005;
  v_summary jsonb;
  v_attention jsonb;
begin
  select p.dealership_id
  into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if p_dealership_id is not null then
    if v_dealership_id is null or v_dealership_id <> p_dealership_id then
      raise exception 'unauthorized';
    end if;
    v_dealership_id := p_dealership_id;
  end if;

  if v_dealership_id is null then
    raise exception 'unauthorized';
  end if;

  v_keys := public.effective_feature_keys_for_active_dealership(v_dealership_id);

  if not ('advanced_metrics' = any (v_keys)) then
    raise exception 'module_not_enabled';
  end if;

  v_threshold := greatest(coalesce(p_attention_threshold_days, 45), 1);
  v_window := greatest(coalesce(p_leads_window_days, 30), 1);

  select
    coalesce(sum(v.sale_price), 0),
    coalesce(avg(greatest(extract(epoch from (now() - coalesce(v.available_since, v.created_at))) / 86400.0, 0)), 0),
    coalesce(
      avg(
        case
          when greatest(extract(epoch from (now() - coalesce(v.available_since, v.created_at))) / 86400.0, 0) > v_threshold
            then 1
          else 0
        end
      ) * 100,
      0
    )
  into v_capital, v_avg_days, v_aged_pct
  from public.vehicles as v
  where v.dealership_id = v_dealership_id
    and v.status = 'available'
    and v.is_active = true;

  v_summary := jsonb_build_object(
    'capital_immobilized', v_capital,
    'average_days_in_stock', round(v_avg_days, 1),
    'estimated_daily_carrying_cost', round(v_capital * v_daily_rate, 2),
    'aged_stock_percent', round(v_aged_pct, 1),
    'aged_threshold_days', v_threshold
  );

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.days_in_stock desc), '[]'::jsonb)
  into v_attention
  from (
    select
      v.id as vehicle_id,
      v.brand,
      v.model,
      v.sale_price,
      round(greatest(extract(epoch from (now() - coalesce(v.available_since, v.created_at))) / 86400.0, 0))::integer as days_in_stock,
      (
        select count(*)::integer
        from public.leads as l
        where l.dealership_id = v.dealership_id
          and l.vehicle_id = v.id
          and l.created_at >= now() - make_interval(days => v_window)
      ) as leads_last_30_days,
      round(v.sale_price * v_daily_rate * greatest(extract(epoch from (now() - coalesce(v.available_since, v.created_at))) / 86400.0, 0), 2) as estimated_carrying_cost,
      case
        when greatest(extract(epoch from (now() - coalesce(v.available_since, v.created_at))) / 86400.0, 0) > 60 then 'review_price'
        when coalesce(array_length(v.images, 1), 0) < 3 then 'add_photos'
        else 'review_price'
      end as suggestion_key
    from public.vehicles as v
    where v.dealership_id = v_dealership_id
      and v.status = 'available'
      and v.is_active = true
      and greatest(extract(epoch from (now() - coalesce(v.available_since, v.created_at))) / 86400.0, 0) >= v_threshold
    order by days_in_stock desc
    limit 20
  ) as t;

  return jsonb_build_object(
    'summary', v_summary,
    'attention_vehicles', v_attention
  );
end;
$$;

comment on function public.get_dealership_inventory_aging_metrics(uuid, integer, integer) is
  'Advanced metrics: capital immobilized, aging, attention list. Requires advanced_metrics module.';

revoke all on function public.get_dealership_inventory_aging_metrics(uuid, integer, integer) from public;
grant execute on function public.get_dealership_inventory_aging_metrics(uuid, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- contract opt-in (migrate e-signature statuses)
-- ---------------------------------------------------------------------------

update public.platform_contracts
set status = 'sent_for_acceptance'
where status = 'sent_for_signature';

update public.platform_contracts
set status = 'accepted'
where status = 'signed';

alter table public.platform_contracts
  drop constraint if exists platform_contracts_status_check;

alter table public.platform_contracts
  add constraint platform_contracts_status_check check (
    status in (
      'draft',
      'sent_for_acceptance',
      'accepted',
      'declined',
      'expired',
      'cancelled'
    )
  );

comment on table public.platform_contracts is
  'Commercial SaaS contract instances; body_snapshot frozen on send; opt-in replaces e-signature.';

create table if not exists public.platform_contract_acceptance_tokens (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.platform_contracts (id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint platform_contract_acceptance_tokens_hash_key unique (token_hash)
);

comment on table public.platform_contract_acceptance_tokens is
  'Single-use hashed tokens for public contract opt-in links.';

create index if not exists platform_contract_acceptance_tokens_contract_idx
  on public.platform_contract_acceptance_tokens (contract_id, expires_at desc);

alter table public.platform_contract_acceptance_tokens enable row level security;

create table if not exists public.platform_legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  acceptance_kind text not null,
  document_version text not null,
  accepted_at timestamptz not null default now(),
  client_ip inet,
  user_agent text,
  constraint platform_legal_acceptances_kind_check check (
    acceptance_kind in (
      'trial_adhesion',
      'platform_terms',
      'privacy_policy',
      'saas_contract'
    )
  )
);

comment on table public.platform_legal_acceptances is
  'Audit trail of legal opt-ins (trial, contract, terms, privacy).';

create index if not exists platform_legal_acceptances_entity_idx
  on public.platform_legal_acceptances (entity_type, entity_id, acceptance_kind);

alter table public.platform_legal_acceptances enable row level security;

create policy "platform_legal_acceptances_select_super_admin"
on public.platform_legal_acceptances
for select
to authenticated
using ((select public.is_platform_super_admin()));

-- trial intake: extended legal columns
alter table public.dealership_onboarding_intakes
  add column if not exists platform_terms_version text;

alter table public.dealership_onboarding_intakes
  add column if not exists platform_terms_accepted_at timestamptz;

alter table public.dealership_onboarding_intakes
  add column if not exists privacy_policy_version text;

alter table public.dealership_onboarding_intakes
  add column if not exists privacy_policy_accepted_at timestamptz;

-- ---------------------------------------------------------------------------
-- billing due notification scan (cron / edge — service_role)
-- ---------------------------------------------------------------------------

create or replace function public.scan_billing_due_admin_notifications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_count integer := 0;
  v_kind text;
  v_title text;
  v_body text;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'service_role_only';
  end if;

  for v_row in
    select
      h.dealership_id,
      d.name as dealership_name,
      h.due_date,
      h.settlement_status,
      (h.due_date - current_date) as days_until_due
    from public.dealership_billing_history as h
    inner join public.dealerships as d on d.id = h.dealership_id
    where h.settlement_status in ('pending', 'overdue')
  loop
    if v_row.settlement_status = 'overdue' then
      v_kind := 'billing_overdue';
      v_title := 'Mensalidade em atraso';
      v_body := format('%s — verificar cobrança.', v_row.dealership_name);
    elsif v_row.days_until_due = 0 then
      v_kind := 'billing_due_today';
      v_title := 'Mensalidade vence hoje';
      v_body := format('%s — cobrar hoje.', v_row.dealership_name);
    elsif v_row.days_until_due = 3 then
      v_kind := 'billing_due_3';
      v_title := 'Mensalidade em 3 dias';
      v_body := format('%s — vencimento em %s.', v_row.dealership_name, v_row.due_date);
    elsif v_row.days_until_due = 7 then
      v_kind := 'billing_due_7';
      v_title := 'Mensalidade em 7 dias';
      v_body := format('%s — vencimento em %s.', v_row.dealership_name, v_row.due_date);
    else
      continue;
    end if;

    if not exists (
      select 1
      from public.platform_admin_notifications as n
      where n.kind = v_kind
        and n.payload ->> 'dealership_id' = v_row.dealership_id::text
        and n.created_at::date = current_date
    ) then
      perform private.insert_platform_admin_notification(
        v_kind,
        v_title,
        v_body,
        jsonb_build_object(
          'dealership_id', v_row.dealership_id,
          'due_date', v_row.due_date
        ),
        format('/painel/concessionarias/%s', v_row.dealership_id)
      );
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.scan_billing_due_admin_notifications() from public;
grant execute on function public.scan_billing_due_admin_notifications() to service_role;
