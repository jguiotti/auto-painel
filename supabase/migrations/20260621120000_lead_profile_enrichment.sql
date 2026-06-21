/*
  migration: lead profile enrichment — panel CRM
  purpose:
    - atomic upsert of customer profile + sync lead denormalized fields
    - optional link to interest vehicle (vehicle_id) from dealership stock
  affected:
    - public.update_dealership_lead_profile (new rpc)
*/

create or replace function public.update_dealership_lead_profile(
  p_lead_id uuid,
  p_full_name text,
  p_phone text,
  p_email text default null,
  p_document_cpf text default null,
  p_document_cnpj text default null,
  p_billing_address jsonb default '{}'::jsonb,
  p_interest_vehicle_id uuid default null,
  p_update_interest_vehicle boolean default false
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

  if p_update_interest_vehicle and p_interest_vehicle_id is not null then
    if not exists (
      select 1
      from public.vehicles as v
      where v.id = p_interest_vehicle_id
        and v.dealership_id = v_dealership_id
    ) then
      raise exception 'Veículo inválido para esta loja.';
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

  update public.leads as l
  set
    customer_id = v_customer_id,
    client_name = v_name,
    phone = v_phone,
    client_email = nullif(trim(p_email), ''),
    vehicle_id = case
      when p_update_interest_vehicle then p_interest_vehicle_id
      else l.vehicle_id
    end
  where l.id = p_lead_id
    and l.dealership_id = v_dealership_id
  returning * into v_lead;

  return v_lead;
end;
$$;

comment on function public.update_dealership_lead_profile(
  uuid, text, text, text, text, text, jsonb, uuid, boolean
) is
  'Panel users enrich lead profile (customer upsert) and optionally link interest vehicle_id.';

grant execute on function public.update_dealership_lead_profile(
  uuid, text, text, text, text, text, jsonb, uuid, boolean
) to authenticated;

revoke all on function public.update_dealership_lead_profile(
  uuid, text, text, text, text, text, jsonb, uuid, boolean
) from public;

notify pgrst, 'reload schema';
