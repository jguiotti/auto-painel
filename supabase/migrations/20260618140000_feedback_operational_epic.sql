/*
  migration: feedback operacional épico (jun/2026)
  purpose:
    - customers 1:N leads (enriched CRM)
    - lead pipeline status refresh (in_progress, cold, loss reasons)
    - seller visibility pool + claim/reassign RPCs
    - featured_sort_order on vehicles + public listing order
    - theme_config logo_light_url / logo_dark_url
    - lead notification outbox for e-mail to commercial team
  affected:
    - public.customers (new)
    - public.leads, public.lead_notification_outbox (new)
    - public.vehicles.featured_sort_order
    - rpc: claim_dealership_lead, reassign_dealership_lead, count_dealership_leads_needing_attention,
           update_vehicle_featured_sort_orders, upsert_dealership_customer
    - public.list_public_vehicles_filtered (order by featured sort)
  notes:
    - apply via supabase db reset (local) or dashboard / supabase deploy (remote)
    - hard-delete leads: leader roles only (existing policy)
*/

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  full_name text not null,
  phone text not null,
  phone_normalized text generated always as (lower(trim(phone))) stored,
  email text,
  document_cpf text,
  document_cnpj text,
  billing_address jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_phone_not_blank check (char_length(trim(phone)) > 0),
  constraint customers_name_not_blank check (char_length(trim(full_name)) > 0)
);

comment on table public.customers is
  'Enriched buyer profile per dealership; one customer may have many leads over time.';

create unique index if not exists customers_dealership_phone_unique_idx
  on public.customers (dealership_id, phone_normalized);

create index if not exists customers_dealership_id_idx
  on public.customers (dealership_id);

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at_timestamp();

alter table public.customers enable row level security;

create policy "customers_select_tenant_staff"
on public.customers
for select
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

create policy "customers_insert_tenant_staff"
on public.customers
for insert
to authenticated
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = any (array['owner'::text, 'manager'::text, 'seller'::text, 'super_admin'::text])
  )
);

create policy "customers_update_tenant_staff"
on public.customers
for update
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = any (array['owner'::text, 'manager'::text, 'seller'::text, 'super_admin'::text])
  )
)
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

create policy "customers_select_super_admin"
on public.customers
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
      and p.dealership_id is null
  )
);

-- ---------------------------------------------------------------------------
-- leads: customer link + pipeline refresh
-- ---------------------------------------------------------------------------

alter table public.leads
  add column if not exists customer_id uuid references public.customers (id) on delete set null;

alter table public.leads
  add column if not exists loss_reason_code text;

alter table public.leads
  add column if not exists loss_reason_note text;

comment on column public.leads.customer_id is
  'Optional link to enriched customer profile; deduped by phone per dealership on capture.';

comment on column public.leads.loss_reason_code is
  'Closed list when status=lost; other requires loss_reason_note.';

comment on column public.leads.loss_reason_note is
  'Free-text when loss_reason_code=other or extra detail.';

-- drop legacy status constraint before migrating values
alter table public.leads
  drop constraint if exists leads_status_check;

-- migrate contacted -> in_progress
update public.leads
set status = 'in_progress'
where status = 'contacted';

alter table public.leads
  add constraint leads_status_check check (
    status in ('new', 'in_progress', 'hot', 'cold', 'won', 'lost')
  );

alter table public.leads
  drop constraint if exists leads_loss_reason_check;

-- backfill legacy lost rows before enforcing loss reason
update public.leads
set loss_reason_code = 'no_response'
where status = 'lost'
  and loss_reason_code is null;

alter table public.leads
  add constraint leads_loss_reason_check check (
    (
      status = 'lost'
      and loss_reason_code is not null
      and (
        loss_reason_code <> 'other'
        or nullif(trim(loss_reason_note), '') is not null
      )
    )
    or (
      status <> 'lost'
      and loss_reason_code is null
      and loss_reason_note is null
    )
  );

create index if not exists leads_customer_id_idx
  on public.leads (customer_id)
  where customer_id is not null;

create index if not exists leads_dealership_assigned_idx
  on public.leads (dealership_id, assigned_user_id);

-- seller read: unassigned pool + own assigned only
drop policy if exists "leads_select_authenticated_seller_assigned" on public.leads;

create policy "leads_select_authenticated_seller_pool_or_self"
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
  ) = 'seller'
  and (
    assigned_user_id is null
    or assigned_user_id = (select auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- vehicles: featured sort order
-- ---------------------------------------------------------------------------

alter table public.vehicles
  add column if not exists featured_sort_order integer;

comment on column public.vehicles.featured_sort_order is
  'Lower values appear first among featured vehicles on the storefront; null = end of featured block.';

alter table public.vehicles
  drop constraint if exists vehicles_featured_sort_order_check;

alter table public.vehicles
  add constraint vehicles_featured_sort_order_check check (
    featured_sort_order is null
    or (
      is_featured = true
      and featured_sort_order >= 0
      and featured_sort_order <= 9999
    )
  );

create index if not exists vehicles_dealership_featured_sort_idx
  on public.vehicles (dealership_id, featured_sort_order)
  where is_featured = true and is_active = true;

-- ---------------------------------------------------------------------------
-- lead notification outbox (e-mail to commercial team)
-- ---------------------------------------------------------------------------

create table if not exists public.lead_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

comment on table public.lead_notification_outbox is
  'Queue for new-lead e-mail notifications; processed by Edge Function or worker.';

create index if not exists lead_notification_outbox_pending_idx
  on public.lead_notification_outbox (created_at)
  where processed_at is null;

alter table public.lead_notification_outbox enable row level security;

-- service role / edge only — no authenticated direct access
create policy "lead_notification_outbox_service_role_all"
on public.lead_notification_outbox
for all
to service_role
using (true)
with check (true);

-- ---------------------------------------------------------------------------
-- helper: upsert customer by phone within tenant
-- ---------------------------------------------------------------------------

create or replace function private.upsert_customer_by_phone_impl(
  p_dealership_id uuid,
  p_full_name text,
  p_phone text,
  p_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_name text;
  v_phone text;
begin
  v_name := nullif(trim(p_full_name), '');
  v_phone := nullif(trim(p_phone), '');

  if v_name is null or v_phone is null then
    return null;
  end if;

  insert into public.customers (
    dealership_id,
    full_name,
    phone,
    email
  )
  values (
    p_dealership_id,
    v_name,
    v_phone,
    nullif(trim(p_email), '')
  )
  on conflict (dealership_id, phone_normalized)
  do update set
    full_name = excluded.full_name,
    email = coalesce(excluded.email, public.customers.email),
    updated_at = now()
  returning id into v_customer_id;

  return v_customer_id;
end;
$$;

revoke all on function private.upsert_customer_by_phone_impl(uuid, text, text, text) from public;
grant execute on function private.upsert_customer_by_phone_impl(uuid, text, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- rpc: upsert_dealership_customer (panel)
-- ---------------------------------------------------------------------------

create or replace function public.upsert_dealership_customer(
  p_full_name text,
  p_phone text,
  p_email text default null,
  p_document_cpf text default null,
  p_document_cnpj text default null,
  p_billing_address jsonb default '{}'::jsonb,
  p_notes text default null,
  p_customer_id uuid default null
)
returns public.customers
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dealership_id uuid;
  v_row public.customers;
begin
  select p.dealership_id
  into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_dealership_id is null then
    raise exception 'Concessionária não identificada.';
  end if;

  if p_customer_id is not null then
    update public.customers as c
    set
      full_name = nullif(trim(p_full_name), ''),
      phone = nullif(trim(p_phone), ''),
      email = nullif(trim(p_email), ''),
      document_cpf = nullif(trim(p_document_cpf), ''),
      document_cnpj = nullif(trim(p_document_cnpj), ''),
      billing_address = coalesce(p_billing_address, '{}'::jsonb),
      notes = nullif(trim(p_notes), ''),
      updated_at = now()
    where c.id = p_customer_id
      and c.dealership_id = v_dealership_id
    returning * into v_row;

    if v_row.id is null then
      raise exception 'Cliente não encontrado.';
    end if;

    return v_row;
  end if;

  v_row := null;
  insert into public.customers (
    dealership_id,
    full_name,
    phone,
    email,
    document_cpf,
    document_cnpj,
    billing_address,
    notes
  )
  values (
    v_dealership_id,
    nullif(trim(p_full_name), ''),
    nullif(trim(p_phone), ''),
    nullif(trim(p_email), ''),
    nullif(trim(p_document_cpf), ''),
    nullif(trim(p_document_cnpj), ''),
    coalesce(p_billing_address, '{}'::jsonb),
    nullif(trim(p_notes), '')
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.upsert_dealership_customer(
  text, text, text, text, text, jsonb, text, uuid
) to authenticated;

revoke all on function public.upsert_dealership_customer(
  text, text, text, text, text, jsonb, text, uuid
) from public;

-- ---------------------------------------------------------------------------
-- rpc: claim_dealership_lead (seller pool)
-- ---------------------------------------------------------------------------

create or replace function public.claim_dealership_lead(p_lead_id uuid)
returns public.leads
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_dealership_id uuid;
  v_role text;
  v_row public.leads;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'Não autenticado.';
  end if;

  select p.dealership_id, p.role
  into v_dealership_id, v_role
  from public.profiles as p
  where p.id = v_user_id;

  if v_role <> 'seller' then
    raise exception 'Somente vendedores assumem leads da fila.';
  end if;

  update public.leads as l
  set
    assigned_user_id = v_user_id,
    status = case when l.status = 'new' then 'in_progress' else l.status end
  where l.id = p_lead_id
    and l.dealership_id = v_dealership_id
    and l.assigned_user_id is null
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Lead indisponível ou já atribuído.';
  end if;

  return v_row;
end;
$$;

grant execute on function public.claim_dealership_lead(uuid) to authenticated;
revoke all on function public.claim_dealership_lead(uuid) from public;

-- ---------------------------------------------------------------------------
-- rpc: reassign_dealership_lead (owner/manager)
-- ---------------------------------------------------------------------------

create or replace function public.reassign_dealership_lead(
  p_lead_id uuid,
  p_assignee_user_id uuid
)
returns public.leads
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dealership_id uuid;
  v_row public.leads;
begin
  select p.dealership_id
  into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid())
    and p.role = any (array['owner'::text, 'manager'::text]);

  if v_dealership_id is null then
    raise exception 'Sem permissão para repassar leads.';
  end if;

  if not exists (
    select 1
    from public.profiles as p
    where p.id = p_assignee_user_id
      and p.dealership_id = v_dealership_id
      and p.role = any (array['owner'::text, 'manager'::text, 'seller'::text])
  ) then
    raise exception 'Colaborador inválido para esta loja.';
  end if;

  update public.leads as l
  set assigned_user_id = p_assignee_user_id
  where l.id = p_lead_id
    and l.dealership_id = v_dealership_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Lead não encontrado.';
  end if;

  return v_row;
end;
$$;

grant execute on function public.reassign_dealership_lead(uuid, uuid) to authenticated;
revoke all on function public.reassign_dealership_lead(uuid, uuid) from public;

-- ---------------------------------------------------------------------------
-- rpc: count_dealership_leads_needing_attention (sidebar badge)
-- ---------------------------------------------------------------------------

create or replace function public.count_dealership_leads_needing_attention(
  p_dealership_id uuid
)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)::integer
  from public.leads as l
  inner join public.profiles as p on p.id = (select auth.uid())
  where l.dealership_id = p_dealership_id
    and l.dealership_id = p_dealership_id
    and (
      l.status = 'new'
      or (
        l.status = 'in_progress'
        and l.next_follow_up_at is not null
        and l.next_follow_up_at <= now()
      )
    )
    and (
      p.role = any (array['owner'::text, 'manager'::text])
      or (
        p.role = 'seller'
        and (
          l.assigned_user_id is null
          or l.assigned_user_id = p.id
        )
      )
    );
$$;

grant execute on function public.count_dealership_leads_needing_attention(uuid) to authenticated;
revoke all on function public.count_dealership_leads_needing_attention(uuid) from public;

-- ---------------------------------------------------------------------------
-- rpc: update_vehicle_featured_sort_orders (owner/manager)
-- ---------------------------------------------------------------------------

create or replace function public.update_vehicle_featured_sort_orders(
  p_updates jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dealership_id uuid;
  v_role text;
  v_item jsonb;
  v_count integer := 0;
  v_vehicle_id uuid;
  v_sort integer;
begin
  select p.dealership_id, p.role
  into v_dealership_id, v_role
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_role not in ('owner', 'manager', 'super_admin') then
    raise exception 'Sem permissão para ordenar destaques.';
  end if;

  if p_updates is null or jsonb_typeof(p_updates) <> 'array' then
    raise exception 'Payload inválido.';
  end if;

  for v_item in select value from jsonb_array_elements(p_updates)
  loop
    v_vehicle_id := (v_item ->> 'vehicle_id')::uuid;
    v_sort := (v_item ->> 'featured_sort_order')::integer;

    update public.vehicles as v
    set featured_sort_order = v_sort
    where v.id = v_vehicle_id
      and v.dealership_id = v_dealership_id
      and v.is_featured = true;

    if found then
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.update_vehicle_featured_sort_orders(jsonb) to authenticated;
revoke all on function public.update_vehicle_featured_sort_orders(jsonb) from public;

-- ---------------------------------------------------------------------------
-- patch create_public_storefront_lead: customer + outbox
-- ---------------------------------------------------------------------------

create or replace function public.create_public_storefront_lead(
  p_dealership_id uuid,
  p_client_name text,
  p_phone text,
  p_type text,
  p_source text,
  p_privacy_policy_version text,
  p_marketing_consent boolean,
  p_vehicle_id uuid default null,
  p_client_email text default null,
  p_message text default null,
  p_simulation_data jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead_id uuid;
  v_customer_id uuid;
  v_name text;
  v_phone text;
  v_type text;
  v_source text;
  v_version text;
begin
  if p_dealership_id is null then
    raise exception 'Concessionária não identificada.';
  end if;

  if not exists (
    select 1
    from public.dealerships as d
    where d.id = p_dealership_id
      and d.status = 'active'
  ) then
    raise exception 'Concessionária indisponível.';
  end if;

  v_name := nullif(trim(p_client_name), '');
  v_phone := nullif(trim(p_phone), '');
  v_type := nullif(trim(p_type), '');
  v_source := nullif(trim(p_source), '');
  v_version := nullif(trim(p_privacy_policy_version), '');

  if v_name is null or v_phone is null then
    raise exception 'Informe nome e telefone.';
  end if;

  if v_type not in ('contact', 'simulation') then
    raise exception 'Tipo de contato inválido.';
  end if;

  if v_source not in (
    'vehicle_page',
    'finance_simulator',
    'contact_page',
    'whatsapp_float'
  ) then
    raise exception 'Origem de contato inválida.';
  end if;

  if v_version is null then
    raise exception 'Versão da política de privacidade é obrigatória.';
  end if;

  if p_vehicle_id is not null and not exists (
    select 1
    from public.vehicles as v
    where v.id = p_vehicle_id
      and v.dealership_id = p_dealership_id
      and v.is_active = true
      and v.status = 'available'
  ) then
    raise exception 'Veículo indisponível.';
  end if;

  v_customer_id := private.upsert_customer_by_phone_impl(
    p_dealership_id,
    v_name,
    v_phone,
    p_client_email
  );

  insert into public.leads (
    dealership_id,
    vehicle_id,
    customer_id,
    client_name,
    phone,
    client_email,
    message,
    type,
    source,
    simulation_data,
    privacy_policy_accepted_at,
    privacy_policy_version,
    marketing_consent,
    marketing_consent_at,
    status
  )
  values (
    p_dealership_id,
    p_vehicle_id,
    v_customer_id,
    v_name,
    v_phone,
    nullif(trim(p_client_email), ''),
    nullif(trim(p_message), ''),
    v_type,
    v_source,
    coalesce(p_simulation_data, '{}'::jsonb),
    now(),
    v_version,
    coalesce(p_marketing_consent, false),
    case when coalesce(p_marketing_consent, false) then now() else null end,
    'new'
  )
  returning id into v_lead_id;

  insert into public.lead_notification_outbox (dealership_id, lead_id)
  values (p_dealership_id, v_lead_id);

  return v_lead_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- theme_config: dual logo keys (data migration from header_logo_url)
-- ---------------------------------------------------------------------------

update public.dealerships as d
set theme_config = coalesce(d.theme_config, '{}'::jsonb)
  || jsonb_build_object(
    'logo_light_url',
    coalesce(
      nullif(trim(d.theme_config ->> 'logo_light_url'), ''),
      nullif(trim(d.theme_config ->> 'header_logo_url'), ''),
      nullif(trim(d.logo_url), '')
    )
  )
where coalesce(trim(d.theme_config ->> 'logo_light_url'), '') = '';

notify pgrst, 'reload schema';
