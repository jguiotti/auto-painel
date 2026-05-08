/*
  migration: dealership management hub scaffold (billing tables, audit, manager role)
  purpose:
    - operator-only billing tables + monthly history
    - platform_audit_logs writable only by AutoPainel super admins
    - profile role manager (Gestor/a) with mirrored owner privileges on dealerships/leads/profile peers
    - rpc resolve_dealership_id_by_host_for_dashboard resolves tenant ignoring status so dashboard UX can differentiate inactive tenants
*/

-- ---------------------------------------------------------------------------
-- rpc: dashboard host resolver (no dealerships.status predicate)
-- ---------------------------------------------------------------------------

create or replace function public.resolve_dealership_id_by_host_for_dashboard(
  p_host text,
  p_platform_root_domain text
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_host text;
  v_root text;
  r_id uuid;
  v_subdomain_slug text;
begin
  if p_host is null or length(trim(p_host)) = 0 then
    return null;
  end if;

  v_host := lower(trim(regexp_replace(p_host, ':\\d+$', '')));
  if v_host like 'www.%' then
    v_host := substring(v_host from 5);
  end if;

  select d.id into r_id
  from public.dealerships as d
  where nullif(trim(d.custom_domain), '') is not null
    and lower(regexp_replace(trim(d.custom_domain), '^www\.', '')) = v_host
  limit 1;

  if r_id is not null then
    return r_id;
  end if;

  if p_platform_root_domain is null or length(trim(p_platform_root_domain)) = 0 then
    return null;
  end if;

  v_root := lower(trim(regexp_replace(p_platform_root_domain, ':\\d+$', '')));

  if v_host = v_root then
    return null;
  end if;

  if not (v_host like '%.' || v_root) then
    return null;
  end if;

  v_subdomain_slug := split_part(v_host, '.', 1);

  select d.id into r_id
  from public.dealerships as d
  where d.slug = v_subdomain_slug
  limit 1;

  return r_id;
end;
$$;

comment on function public.resolve_dealership_id_by_host_for_dashboard(text, text) is
  'Dashboard/login host resolver; intentionally ignores dealerships.status whereas resolve_dealership_id_by_host enforces storefront safety.';

revoke all on function public.resolve_dealership_id_by_host_for_dashboard(text, text) from public;
grant execute on function public.resolve_dealership_id_by_host_for_dashboard(text, text) to anon, authenticated;

create or replace function public.get_dealership_id_by_slug_for_dashboard(p_slug text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select d.id
  from public.dealerships as d
  where d.slug = p_slug
  limit 1;
$$;

comment on function public.get_dealership_id_by_slug_for_dashboard(text) is
  'Dev helper: resolve dealerships.id from slug ignoring status for dashboard localhost flows.';

revoke all on function public.get_dealership_id_by_slug_for_dashboard(text) from public;
grant execute on function public.get_dealership_id_by_slug_for_dashboard(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles: tenant manager role between owner + seller
-- ---------------------------------------------------------------------------

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (
    role in ('super_admin', 'owner', 'manager', 'seller')
  );

alter table public.profiles drop constraint if exists profiles_dealership_scope_check;

alter table public.profiles
  add constraint profiles_dealership_scope_check check (
    (
      role = 'super_admin'
      and dealership_id is null
    )
    or (
      role in ('owner', 'manager', 'seller')
      and dealership_id is not null
    )
  );

comment on column public.profiles.role is
  'super_admin: AutoPainel ops without dealership_id. owner: tenant owner. manager: privileged collaborator. seller: restricted CRM/inventory workflows.';

-- ---------------------------------------------------------------------------
-- rls tweaks: dealerships + profiles peers + leads (owner OR manager everywhere owner-only)
-- ---------------------------------------------------------------------------

drop policy if exists "dealerships_update_authenticated_owner_same_tenant" on public.dealerships;

create policy "dealerships_update_authenticated_owner_manager_same_tenant"
on public.dealerships
for update
to authenticated
using (
  id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = any (array['owner'::text, 'manager'::text])
  )
)
with check (
  id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = any (array['owner'::text, 'manager'::text])
  )
);

drop policy if exists "profiles_update_authenticated_owner_peers" on public.profiles;

create policy "profiles_update_authenticated_leader_peers"
on public.profiles
for update
to authenticated
using (
  (select pr.role from public.profiles as pr where pr.id = (select auth.uid()))
    = any (array['owner'::text, 'manager'::text])
  and dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
  and id <> (select auth.uid())
)
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

drop policy if exists "leads_select_authenticated_owner_same_tenant" on public.leads;

create policy "leads_select_authenticated_leader_same_tenant"
on public.leads
for select
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
  and (
    select pr.role
    from public.profiles as pr
    where pr.id = (select auth.uid())
  ) = any (array['owner'::text, 'manager'::text])
);

drop policy if exists "leads_update_authenticated_owner_same_tenant" on public.leads;

create policy "leads_update_authenticated_leader_same_tenant"
on public.leads
for update
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
  and (
    select pr.role
    from public.profiles as pr
    where pr.id = (select auth.uid())
  ) = any (array['owner'::text, 'manager'::text])
)
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

drop policy if exists "leads_delete_authenticated_owner_same_tenant" on public.leads;

create policy "leads_delete_authenticated_leader_same_tenant"
on public.leads
for delete
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
  and (
    select pr.role
    from public.profiles as pr
    where pr.id = (select auth.uid())
  ) = any (array['owner'::text, 'manager'::text])
);

-- ---------------------------------------------------------------------------
-- operator billing + history (super_admin JWT only via RLS)
-- ---------------------------------------------------------------------------

create table if not exists public.dealership_billing (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null unique references public.dealerships (id) on delete cascade,
  monthly_amount numeric(14, 2) not null default 0 check (monthly_amount >= 0),
  due_day integer not null default 10 check (
    due_day between 1 and 28
  ),
  payment_method text,
  last_payment_date timestamptz,
  agreement_status text not null default 'active' check (
    agreement_status in ('draft', 'active', 'paused', 'terminated')
  ),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.dealership_billing is
  'Commercial billing agreement snapshots for SaaS invoicing — AutoPainel operator data, not surfaced to dealership-panel tenants.';

create table if not exists public.dealership_billing_history (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  billing_period_start date not null,
  expected_amount numeric(14, 2) not null check (expected_amount >= 0),
  settlement_status text not null check (
    settlement_status in ('paid', 'pending', 'overdue')
  ),
  due_date date not null,
  paid_at timestamptz,
  reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dealership_billing_history_period_unique unique (dealership_id, billing_period_start)
);

comment on table public.dealership_billing_history is
  'Operator ledger of SaaS installments per dealership — used by admin dashboards and alerting.';

create index if not exists dealership_billing_history_dealership_due_idx
  on public.dealership_billing_history (dealership_id, settlement_status, due_date);

create table if not exists public.platform_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid not null references auth.users (id),
  action_key text not null,
  entity_type text not null,
  entity_uuid uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint platform_audit_logs_action_trimmed check (length(trim(action_key)) >= 3)
);

comment on table public.platform_audit_logs is
  'Immutable-ish audit stream for privileged platform actions (pricing, billing, tenancy status toggles).';

create index if not exists platform_audit_logs_entity_idx
  on public.platform_audit_logs (entity_type, entity_uuid, created_at desc);

-- triggers: updated_at
drop trigger if exists trg_dealership_billing_updated_at on public.dealership_billing;
create trigger trg_dealership_billing_updated_at
before update on public.dealership_billing
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_dealership_billing_history_updated_at on public.dealership_billing_history;
create trigger trg_dealership_billing_history_updated_at
before update on public.dealership_billing_history
for each row
execute function public.set_updated_at_timestamp();

-- rls
alter table public.dealership_billing enable row level security;
alter table public.dealership_billing_history enable row level security;
alter table public.platform_audit_logs enable row level security;

create policy "dealership_billing_select_super_admin"
on public.dealership_billing
for select
to authenticated
using ( (select public.is_platform_super_admin()) );

create policy "dealership_billing_insert_super_admin"
on public.dealership_billing
for insert
to authenticated
with check ( (select public.is_platform_super_admin()) );

create policy "dealership_billing_update_super_admin"
on public.dealership_billing
for update
to authenticated
using ( (select public.is_platform_super_admin()) )
with check ( (select public.is_platform_super_admin()) );

create policy "dealership_billing_delete_super_admin"
on public.dealership_billing
for delete
to authenticated
using ( (select public.is_platform_super_admin()) );

create policy "dealership_billing_history_select_super_admin"
on public.dealership_billing_history
for select
to authenticated
using ( (select public.is_platform_super_admin()) );

create policy "dealership_billing_history_insert_super_admin"
on public.dealership_billing_history
for insert
to authenticated
with check ( (select public.is_platform_super_admin()) );

create policy "dealership_billing_history_update_super_admin"
on public.dealership_billing_history
for update
to authenticated
using ( (select public.is_platform_super_admin()) )
with check ( (select public.is_platform_super_admin()) );

create policy "dealership_billing_history_delete_super_admin"
on public.dealership_billing_history
for delete
to authenticated
using ( (select public.is_platform_super_admin()) );

create policy "platform_audit_logs_select_super_admin"
on public.platform_audit_logs
for select
to authenticated
using ( (select public.is_platform_super_admin()) );

create policy "platform_audit_logs_insert_super_admin"
on public.platform_audit_logs
for insert
to authenticated
with check ( (select public.is_platform_super_admin()) );

grant select, insert, update, delete on public.dealership_billing to authenticated;
grant select, insert, update, delete on public.dealership_billing_history to authenticated;
grant select, insert on public.platform_audit_logs to authenticated;
