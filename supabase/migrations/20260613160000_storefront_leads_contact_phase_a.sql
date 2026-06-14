/*
  migration: storefront phase A — general leads, consent, public contact RPCs
  purpose:
    - allow leads without vehicle (contact page, whatsapp float)
    - LGPD consent fields on leads
    - security definer RPC for anon lead creation
    - public units list for contact page maps
*/

-- ---------------------------------------------------------------------------
-- leads: optional vehicle + source + consent
-- ---------------------------------------------------------------------------

alter table public.leads
  alter column vehicle_id drop not null;

alter table public.leads
  add column if not exists source text not null default 'vehicle_page';

alter table public.leads
  add column if not exists client_email text;

alter table public.leads
  add column if not exists message text;

alter table public.leads
  add column if not exists privacy_policy_accepted_at timestamptz;

alter table public.leads
  add column if not exists privacy_policy_version text;

alter table public.leads
  add column if not exists marketing_consent boolean not null default false;

alter table public.leads
  add column if not exists marketing_consent_at timestamptz;

alter table public.leads
  drop constraint if exists leads_source_check;

alter table public.leads
  add constraint leads_source_check check (
    source in (
      'vehicle_page',
      'finance_simulator',
      'contact_page',
      'whatsapp_float'
    )
  );

comment on column public.leads.source is
  'Storefront capture channel: vehicle page, finance simulator, contact page, or whatsapp float.';

comment on column public.leads.client_email is
  'Optional e-mail provided by the visitor on contact forms.';

comment on column public.leads.message is
  'Free-text message from contact or whatsapp float forms.';

-- ---------------------------------------------------------------------------
-- create_public_storefront_lead — anon-safe insert with validation
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

  if v_source not in ('vehicle_page', 'finance_simulator', 'contact_page', 'whatsapp_float') then
    raise exception 'Origem de contato inválida.';
  end if;

  if v_version is null then
    raise exception 'Aceite da política de privacidade é obrigatório.';
  end if;

  if p_vehicle_id is not null then
    if not exists (
      select 1
      from public.get_public_vehicle_by_id(p_vehicle_id, p_dealership_id)
    ) then
      raise exception 'Veículo indisponível ou não encontrado.';
    end if;
  elsif v_source in ('vehicle_page', 'finance_simulator') then
    raise exception 'Veículo é obrigatório para este tipo de contato.';
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
    simulation_data,
    privacy_policy_accepted_at,
    privacy_policy_version,
    marketing_consent,
    marketing_consent_at
  )
  values (
    p_dealership_id,
    p_vehicle_id,
    v_name,
    v_phone,
    v_type,
    v_source,
    nullif(trim(p_client_email), ''),
    nullif(trim(p_message), ''),
    coalesce(p_simulation_data, '{}'::jsonb),
    now(),
    v_version,
    coalesce(p_marketing_consent, false),
    case when coalesce(p_marketing_consent, false) then now() else null end
  )
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

comment on function public.create_public_storefront_lead(
  uuid, text, text, text, text, text, boolean, uuid, text, text, jsonb
) is
  'Public vitrine: create lead with LGPD consent; validates active dealership and optional vehicle.';

revoke all on function public.create_public_storefront_lead(
  uuid, text, text, text, text, text, boolean, uuid, text, text, jsonb
) from public;

grant execute on function public.create_public_storefront_lead(
  uuid, text, text, text, text, text, boolean, uuid, text, text, jsonb
) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- list_dealership_public_units — contact page branch addresses (anon-safe)
-- ---------------------------------------------------------------------------

create or replace function public.list_dealership_public_units(p_dealership_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', du.id,
          'name', du.name,
          'address', du.address,
          'sort_order', du.sort_order
        )
        order by du.sort_order asc, du.created_at asc
      )
      from public.dealership_units as du
      inner join public.dealerships as d on d.id = du.dealership_id
      where du.dealership_id = p_dealership_id
        and d.status = 'active'
    ),
    '[]'::jsonb
  );
$$;

comment on function public.list_dealership_public_units(uuid) is
  'Public vitrine: list dealership units with addresses for contact page (active tenants only).';

revoke all on function public.list_dealership_public_units(uuid) from public;
grant execute on function public.list_dealership_public_units(uuid) to anon, authenticated;
