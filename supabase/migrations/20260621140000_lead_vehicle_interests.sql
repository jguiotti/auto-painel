/*
  migration: lead vehicle interests (many-to-many)
  purpose:
    - allow multiple stock vehicles per lead as purchase interests
    - sold vehicles excluded from link picker (available only)
    - sync legacy leads.vehicle_id into junction on backfill
  affected:
    - public.lead_vehicle_interests (new)
    - public.update_dealership_lead_profile (interest vehicle ids array)
    - trigger on vehicles status sold → lock purchase link
*/

create table if not exists public.lead_vehicle_interests (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint lead_vehicle_interests_lead_vehicle_uidx unique (lead_id, vehicle_id)
);

comment on table public.lead_vehicle_interests is
  'Vehicles a lead is interested in (available stock). Sold vehicles are removed from picker; purchase uses leads.converted_vehicle_id.';

create index if not exists lead_vehicle_interests_lead_id_idx
  on public.lead_vehicle_interests (lead_id);

create index if not exists lead_vehicle_interests_vehicle_id_idx
  on public.lead_vehicle_interests (vehicle_id);

create index if not exists lead_vehicle_interests_dealership_id_idx
  on public.lead_vehicle_interests (dealership_id);

alter table public.lead_vehicle_interests enable row level security;

create policy "lead_vehicle_interests_select_tenant_staff"
on public.lead_vehicle_interests
for select
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

create policy "lead_vehicle_interests_insert_tenant_staff"
on public.lead_vehicle_interests
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

create policy "lead_vehicle_interests_delete_tenant_staff"
on public.lead_vehicle_interests
for delete
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = any (array['owner'::text, 'manager'::text, 'seller'::text, 'super_admin'::text])
  )
);

-- backfill from legacy single vehicle_id
insert into public.lead_vehicle_interests (dealership_id, lead_id, vehicle_id)
select l.dealership_id, l.id, l.vehicle_id
from public.leads as l
inner join public.vehicles as v on v.id = l.vehicle_id
where l.vehicle_id is not null
  and v.status = 'available'
on conflict (lead_id, vehicle_id) do nothing;

-- remove interests on vehicles that are no longer available
delete from public.lead_vehicle_interests as lvi
using public.vehicles as v
where lvi.vehicle_id = v.id
  and v.status <> 'available';

create or replace function private.sync_lead_vehicle_interests_on_sold()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'sold' and old.status is distinct from 'sold' then
    delete from public.lead_vehicle_interests as lvi
    where lvi.vehicle_id = new.id
      and not exists (
        select 1
        from public.leads as l
        where l.converted_vehicle_id = new.id
          and l.id = lvi.lead_id
      );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_lead_vehicle_interests_on_sold on public.vehicles;
create trigger trg_sync_lead_vehicle_interests_on_sold
after update of status on public.vehicles
for each row
execute function private.sync_lead_vehicle_interests_on_sold();

drop function if exists public.update_dealership_lead_profile(
  uuid, text, text, text, text, text, jsonb, uuid, boolean
);

create or replace function public.update_dealership_lead_profile(
  p_lead_id uuid,
  p_full_name text,
  p_phone text,
  p_email text default null,
  p_document_cpf text default null,
  p_document_cnpj text default null,
  p_billing_address jsonb default '{}'::jsonb,
  p_interest_vehicle_ids uuid[] default null,
  p_update_interest_vehicles boolean default false
)
returns public.leads
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_dealership_id uuid;
  v_role text;
  v_lead public.leads;
  v_customer_id uuid;
  v_name text;
  v_phone text;
  v_billing jsonb;
  v_vehicle_id uuid;
  v_ids uuid[];
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
    raise exception 'Sem permissão para editar contatos.';
  end if;

  select l.*
  into v_lead
  from public.leads as l
  where l.id = p_lead_id
    and l.dealership_id = v_dealership_id;

  if v_lead.id is null then
    raise exception 'Contato não encontrado.';
  end if;

  if v_role = 'seller' and v_lead.assigned_user_id is distinct from v_user_id then
    raise exception 'Somente o responsável pode editar este contato.';
  end if;

  v_name := nullif(trim(p_full_name), '');
  v_phone := nullif(trim(p_phone), '');

  if v_name is null or v_phone is null then
    raise exception 'Informe nome e telefone.';
  end if;

  if p_update_interest_vehicles then
    v_ids := coalesce(p_interest_vehicle_ids, array[]::uuid[]);

    if exists (
      select 1
      from unnest(v_ids) as vid
      left join public.vehicles as v
        on v.id = vid
        and v.dealership_id = v_dealership_id
        and v.status = 'available'
      where v.id is null
    ) then
      raise exception 'Um ou mais veículos são inválidos, vendidos ou não pertencem a esta loja.';
    end if;

    if exists (
      select 1
      from unnest(v_ids) as vid
      inner join public.leads as l
        on l.converted_vehicle_id = vid
        and l.id <> p_lead_id
        and l.dealership_id = v_dealership_id
    ) then
      raise exception 'Um veículo selecionado já foi vendido para outro contato.';
    end if;
  end if;

  v_billing := coalesce(p_billing_address, '{}'::jsonb);

  if v_lead.customer_id is not null then
    update public.customers as c
    set
      full_name = v_name,
      phone = v_phone,
      email = nullif(trim(p_email), ''),
      document_cpf = nullif(trim(p_document_cpf), ''),
      document_cnpj = nullif(trim(p_document_cnpj), ''),
      billing_address = v_billing,
      updated_at = now()
    where c.id = v_lead.customer_id
      and c.dealership_id = v_dealership_id
    returning c.id into v_customer_id;
  end if;

  if v_customer_id is null then
    insert into public.customers (
      dealership_id,
      full_name,
      phone,
      email,
      document_cpf,
      document_cnpj,
      billing_address
    )
    values (
      v_dealership_id,
      v_name,
      v_phone,
      nullif(trim(p_email), ''),
      nullif(trim(p_document_cpf), ''),
      nullif(trim(p_document_cnpj), ''),
      v_billing
    )
    on conflict (dealership_id, phone_normalized)
    do update set
      full_name = excluded.full_name,
      email = coalesce(excluded.email, public.customers.email),
      document_cpf = coalesce(excluded.document_cpf, public.customers.document_cpf),
      document_cnpj = coalesce(excluded.document_cnpj, public.customers.document_cnpj),
      billing_address = case
        when excluded.billing_address <> '{}'::jsonb then excluded.billing_address
        else public.customers.billing_address
      end,
      updated_at = now()
    returning id into v_customer_id;
  end if;

  v_vehicle_id := case
    when p_update_interest_vehicles and coalesce(array_length(v_ids, 1), 0) > 0 then v_ids[1]
    when p_update_interest_vehicles then null
    else v_lead.vehicle_id
  end;

  update public.leads as l
  set
    customer_id = v_customer_id,
    client_name = v_name,
    phone = v_phone,
    client_email = nullif(trim(p_email), ''),
    vehicle_id = v_vehicle_id
  where l.id = p_lead_id
    and l.dealership_id = v_dealership_id
  returning * into v_lead;

  if p_update_interest_vehicles then
    delete from public.lead_vehicle_interests as lvi
    where lvi.lead_id = p_lead_id
      and lvi.dealership_id = v_dealership_id;

    insert into public.lead_vehicle_interests (dealership_id, lead_id, vehicle_id)
    select v_dealership_id, p_lead_id, vid
    from unnest(v_ids) as vid
    on conflict (lead_id, vehicle_id) do nothing;
  end if;

  return v_lead;
end;
$$;

comment on function public.update_dealership_lead_profile(
  uuid, text, text, text, text, text, jsonb, uuid[], boolean
) is
  'Panel: enrich customer profile and sync multiple interest vehicles (available stock only).';

grant execute on function public.update_dealership_lead_profile(
  uuid, text, text, text, text, text, jsonb, uuid[], boolean
) to authenticated;

revoke all on function public.update_dealership_lead_profile(
  uuid, text, text, text, text, text, jsonb, uuid[], boolean
) from public;

notify pgrst, 'reload schema';
