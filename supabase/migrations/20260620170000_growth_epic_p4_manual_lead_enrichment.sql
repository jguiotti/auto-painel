/*
  migration: growth epic P4 — manual lead enrichment
  purpose:
    - extend create_dealership_manual_lead to upsert customers with document + billing address
    - link leads.customer_id on manual panel registration
  affected:
    - public.create_dealership_manual_lead
*/

drop function if exists public.create_dealership_manual_lead(text, text, text, text, uuid, boolean);

create or replace function public.create_dealership_manual_lead(
  p_client_name text,
  p_phone text,
  p_client_email text default null,
  p_message text default null,
  p_vehicle_id uuid default null,
  p_assign_to_self boolean default true,
  p_document_cpf text default null,
  p_document_cnpj text default null,
  p_billing_address jsonb default '{}'::jsonb
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

  v_billing := coalesce(p_billing_address, '{}'::jsonb);

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
    nullif(trim(p_client_email), ''),
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
    privacy_policy_accepted_at,
    customer_id
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
    now(),
    v_customer_id
  )
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

comment on function public.create_dealership_manual_lead(
  text, text, text, text, uuid, boolean, text, text, jsonb
) is
  'Authenticated panel users create a manual CRM lead with optional enriched customer profile.';

grant execute on function public.create_dealership_manual_lead(
  text, text, text, text, uuid, boolean, text, text, jsonb
) to authenticated;

revoke all on function public.create_dealership_manual_lead(
  text, text, text, text, uuid, boolean, text, text, jsonb
) from public;
