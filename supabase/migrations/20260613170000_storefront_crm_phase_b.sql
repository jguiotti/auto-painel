/*
  migration: storefront CRM phase B — lead pipeline, notes, manual capture, sale link
  purpose:
    - pipeline status and follow-up on leads
    - lead_notes for team comments
    - manual lead source for panel-created contacts
    - converted_vehicle_id links won leads to sold inventory / sale receipt
  affected:
    - public.leads (status, next_follow_up_at, converted_vehicle_id, created_by)
    - public.lead_notes (new)
    - RLS policies for leads insert/update and lead_notes
*/

-- ---------------------------------------------------------------------------
-- leads: CRM pipeline columns
-- ---------------------------------------------------------------------------

alter table public.leads
  add column if not exists status text not null default 'new';

alter table public.leads
  add column if not exists next_follow_up_at timestamptz;

alter table public.leads
  add column if not exists converted_vehicle_id uuid references public.vehicles (id) on delete set null;

alter table public.leads
  add column if not exists created_by uuid references auth.users (id) on delete set null;

alter table public.leads
  drop constraint if exists leads_status_check;

alter table public.leads
  add constraint leads_status_check check (
    status in ('new', 'contacted', 'hot', 'won', 'lost')
  );

alter table public.leads
  drop constraint if exists leads_source_check;

alter table public.leads
  add constraint leads_source_check check (
    source in (
      'vehicle_page',
      'finance_simulator',
      'contact_page',
      'whatsapp_float',
      'manual'
    )
  );

comment on column public.leads.status is
  'CRM pipeline: new, contacted, hot, won, lost.';

comment on column public.leads.next_follow_up_at is
  'Optional reminder datetime for the assigned seller or manager.';

comment on column public.leads.converted_vehicle_id is
  'When status is won, optional link to the sold vehicle (sale receipt lives on vehicle).';

comment on column public.leads.created_by is
  'Authenticated user who created a manual lead in the panel; null for vitrine captures.';

create index if not exists leads_dealership_status_idx
  on public.leads (dealership_id, status);

create index if not exists leads_next_follow_up_at_idx
  on public.leads (dealership_id, next_follow_up_at)
  where next_follow_up_at is not null;

-- ---------------------------------------------------------------------------
-- lead_notes
-- ---------------------------------------------------------------------------

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint lead_notes_body_not_blank check (char_length(trim(body)) > 0)
);

comment on table public.lead_notes is
  'Internal comments on a lead; visible to tenant staff with lead access.';

create index if not exists lead_notes_lead_id_created_at_idx
  on public.lead_notes (lead_id, created_at desc);

create index if not exists lead_notes_dealership_id_idx
  on public.lead_notes (dealership_id);

alter table public.lead_notes enable row level security;

-- ---------------------------------------------------------------------------
-- leads insert: allow manual panel leads without vehicle
-- ---------------------------------------------------------------------------

drop policy if exists "leads_insert_authenticated_same_tenant" on public.leads;

create policy "leads_insert_authenticated_same_tenant"
on public.leads
for insert
to authenticated
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
  and (
    (
      source = 'manual'
      and vehicle_id is null
      and created_by = (select auth.uid())
    )
    or (
      vehicle_id is not null
      and exists (
        select 1
        from public.vehicles as v
        where v.id = vehicle_id
          and v.dealership_id = leads.dealership_id
      )
    )
  )
);

-- ---------------------------------------------------------------------------
-- lead_notes RLS
-- ---------------------------------------------------------------------------

create policy "lead_notes_select_tenant_with_lead_access"
on public.lead_notes
for select
to authenticated
using (
  exists (
    select 1
    from public.leads as l
    inner join public.profiles as p on p.id = (select auth.uid())
    where l.id = lead_notes.lead_id
      and l.dealership_id = p.dealership_id
      and l.dealership_id = lead_notes.dealership_id
      and (
        p.role = any (array['owner'::text, 'manager'::text, 'super_admin'::text])
        or (p.role = 'seller' and l.assigned_user_id = (select auth.uid()))
      )
  )
);

create policy "lead_notes_insert_tenant_with_lead_access"
on public.lead_notes
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1
    from public.leads as l
    inner join public.profiles as p on p.id = (select auth.uid())
    where l.id = lead_notes.lead_id
      and l.dealership_id = p.dealership_id
      and l.dealership_id = lead_notes.dealership_id
      and (
        p.role = any (array['owner'::text, 'manager'::text, 'super_admin'::text])
        or (p.role = 'seller' and l.assigned_user_id = (select auth.uid()))
      )
  )
);

create policy "lead_notes_delete_leader_same_tenant"
on public.lead_notes
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = lead_notes.dealership_id
      and p.role = any (array['owner'::text, 'manager'::text, 'super_admin'::text])
  )
);

-- super_admin cross-tenant (mirrors leads policies)
create policy "lead_notes_select_super_admin"
on public.lead_notes
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

create policy "lead_notes_insert_super_admin"
on public.lead_notes
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
      and p.dealership_id is null
  )
);

create policy "lead_notes_delete_super_admin"
on public.lead_notes
for delete
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
-- rpc: create manual lead from panel (authenticated)
-- ---------------------------------------------------------------------------

create or replace function public.create_dealership_manual_lead(
  p_client_name text,
  p_phone text,
  p_client_email text default null,
  p_message text default null,
  p_vehicle_id uuid default null,
  p_assign_to_self boolean default true
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_dealership_id uuid;
  v_role text;
  v_lead_id uuid;
  v_name text;
  v_phone text;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'Não autenticado.';
  end if;

  select p.dealership_id, p.role
  into v_dealership_id, v_role
  from public.profiles as p
  where p.id = v_user_id;

  if v_dealership_id is null then
    raise exception 'Concessionária não identificada.';
  end if;

  if v_role not in ('owner', 'manager', 'seller', 'super_admin') then
    raise exception 'Sem permissão para cadastrar contatos.';
  end if;

  v_name := nullif(trim(p_client_name), '');
  v_phone := nullif(trim(p_phone), '');

  if v_name is null or v_phone is null then
    raise exception 'Informe nome e telefone.';
  end if;

  if p_vehicle_id is not null then
    if not exists (
      select 1
      from public.vehicles as v
      where v.id = p_vehicle_id
        and v.dealership_id = v_dealership_id
    ) then
      raise exception 'Veículo inválido para esta loja.';
    end if;
  end if;

  insert into public.leads (
    dealership_id,
    vehicle_id,
    client_name,
    phone,
    type,
    source,
    client_email,
    message,
    status,
    created_by,
    assigned_user_id,
    privacy_policy_version,
    privacy_policy_accepted_at
  )
  values (
    v_dealership_id,
    p_vehicle_id,
    v_name,
    v_phone,
    'contact',
    'manual',
    nullif(trim(p_client_email), ''),
    nullif(trim(p_message), ''),
    'new',
    v_user_id,
    case
      when p_assign_to_self and v_role = 'seller' then v_user_id
      else null
    end,
    'panel_manual',
    now()
  )
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

comment on function public.create_dealership_manual_lead(text, text, text, text, uuid, boolean) is
  'Authenticated panel users create a manual CRM lead; sellers may auto-assign to self.';

grant execute on function public.create_dealership_manual_lead(text, text, text, text, uuid, boolean)
  to authenticated;
