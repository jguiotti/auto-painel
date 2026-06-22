/*
  migration: trial campaign — pricing module matrix + dealership onboarding intakes
  purpose:
    - realign starter/business/enterprise (and trial) module pivots for marketing campaign
    - public onboarding intake table linked to saas_prospects with convert path to dealerships
    - storage bucket for pre-provision branding assets
  affected: public.pricing_plan_modules, public.dealership_onboarding_intakes, storage
*/

-- ---------------------------------------------------------------------------
-- pricing_plan_modules: campaign matrix (Essencial / Profissional / Completo)
-- starter: finance_simulator, qr_generator, advanced_metrics
-- business: starter + recibo_compra
-- enterprise: all active saas_modules
-- trial: mirrors starter (1-month free Essencial campaign)
-- ---------------------------------------------------------------------------

delete from public.pricing_plan_modules as ppm
using public.pricing_plans as pp
where ppm.pricing_plan_id = pp.id
  and pp.slug in ('starter', 'business', 'enterprise', 'trial');

insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select pp.id, sm.id
from public.pricing_plans as pp
inner join public.saas_modules as sm
  on sm.key in ('finance_simulator', 'qr_generator', 'advanced_metrics')
  and sm.is_active = true
where pp.slug in ('starter', 'trial')
on conflict do nothing;

insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select pp.id, sm.id
from public.pricing_plans as pp
inner join public.saas_modules as sm
  on sm.key in (
    'finance_simulator',
    'qr_generator',
    'advanced_metrics',
    'recibo_compra'
  )
  and sm.is_active = true
where pp.slug = 'business'
on conflict do nothing;

insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select pp.id, sm.id
from public.pricing_plans as pp
cross join public.saas_modules as sm
where pp.slug = 'enterprise'
  and sm.is_active = true
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- dealership_onboarding_intakes: public trial onboarding submissions
-- ---------------------------------------------------------------------------

create table if not exists public.dealership_onboarding_intakes (
  id uuid primary key default gen_random_uuid(),
  saas_prospect_id uuid references public.saas_prospects (id) on delete set null,
  status text not null default 'submitted',
  payload jsonb not null default '{}'::jsonb,
  converted_dealership_id uuid references public.dealerships (id) on delete set null,
  trial_legal_version text,
  trial_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dealership_onboarding_intakes_status_check check (
    status in ('submitted', 'linked', 'converted', 'archived')
  )
);

comment on table public.dealership_onboarding_intakes is
  'Public trial onboarding form payloads; linked to B2B leads and converted to dealerships by platform admin.';

create index if not exists dealership_onboarding_intakes_status_created_idx
  on public.dealership_onboarding_intakes (status, created_at desc);

create index if not exists dealership_onboarding_intakes_saas_prospect_id_idx
  on public.dealership_onboarding_intakes (saas_prospect_id)
  where saas_prospect_id is not null;

alter table public.dealership_onboarding_intakes enable row level security;

create policy "dealership_onboarding_intakes_select_super_admin"
on public.dealership_onboarding_intakes
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "dealership_onboarding_intakes_update_super_admin"
on public.dealership_onboarding_intakes
for update
to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

-- ---------------------------------------------------------------------------
-- rpc: submit onboarding intake (anon-safe insert + optional saas_prospect link)
-- ---------------------------------------------------------------------------

create or replace function public.submit_dealership_onboarding_intake(
  p_payload jsonb,
  p_trial_legal_version text,
  p_trial_accepted_at timestamptz,
  p_saas_prospect_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_store_name text;
  v_email text;
begin
  if p_payload is null or p_payload = '{}'::jsonb then
    raise exception 'payload_required';
  end if;

  if p_trial_legal_version is null or length(trim(p_trial_legal_version)) = 0 then
    raise exception 'trial_legal_version_required';
  end if;

  if p_trial_accepted_at is null then
    raise exception 'trial_acceptance_required';
  end if;

  v_store_name := nullif(trim(p_payload -> 'general' ->> 'store_name'), '');
  v_email := nullif(trim(p_payload -> 'general' ->> 'contact_email'), '');

  if v_store_name is null or length(v_store_name) < 2 then
    raise exception 'store_name_required';
  end if;

  if v_email is null or v_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'contact_email_invalid';
  end if;

  if p_saas_prospect_id is not null then
    if not exists (
      select 1
      from public.saas_prospects as sp
      where sp.id = p_saas_prospect_id
    ) then
      raise exception 'saas_prospect_not_found';
    end if;
  end if;

  insert into public.dealership_onboarding_intakes (
    saas_prospect_id,
    status,
    payload,
    trial_legal_version,
    trial_accepted_at
  )
  values (
    p_saas_prospect_id,
    case when p_saas_prospect_id is not null then 'linked' else 'submitted' end,
    p_payload,
    p_trial_legal_version,
    p_trial_accepted_at
  )
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.submit_dealership_onboarding_intake(jsonb, text, timestamptz, uuid) is
  'Marketing trial onboarding: inserts intake row; optional link to existing saas_prospect.';

revoke all on function public.submit_dealership_onboarding_intake(jsonb, text, timestamptz, uuid) from public;
grant execute on function public.submit_dealership_onboarding_intake(jsonb, text, timestamptz, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- rpc: link intake to saas_prospect (admin)
-- ---------------------------------------------------------------------------

create or replace function public.link_dealership_onboarding_intake_to_prospect(
  p_intake_id uuid,
  p_saas_prospect_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_platform_super_admin()) then
    raise exception 'forbidden';
  end if;

  if not exists (
    select 1
    from public.dealership_onboarding_intakes as i
    where i.id = p_intake_id
  ) then
    raise exception 'intake_not_found';
  end if;

  if not exists (
    select 1
    from public.saas_prospects as sp
    where sp.id = p_saas_prospect_id
  ) then
    raise exception 'saas_prospect_not_found';
  end if;

  update public.dealership_onboarding_intakes as i
  set
    saas_prospect_id = p_saas_prospect_id,
    status = 'linked',
    updated_at = now()
  where i.id = p_intake_id;
end;
$$;

comment on function public.link_dealership_onboarding_intake_to_prospect(uuid, uuid) is
  'Platform admin: associate onboarding intake with B2B commercial lead.';

revoke all on function public.link_dealership_onboarding_intake_to_prospect(uuid, uuid) from public;
grant execute on function public.link_dealership_onboarding_intake_to_prospect(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- storage: onboarding intake assets (server-side upload via service role)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('dealership-onboarding-intakes', 'dealership-onboarding-intakes', true)
on conflict (id) do update set public = excluded.public;

create policy "dealership_onboarding_intakes_storage_select_public"
on storage.objects
for select
to public
using (bucket_id = 'dealership-onboarding-intakes');

create policy "dealership_onboarding_intakes_storage_insert_service"
on storage.objects
for insert
to service_role
with check (bucket_id = 'dealership-onboarding-intakes');

create policy "dealership_onboarding_intakes_storage_update_service"
on storage.objects
for update
to service_role
using (bucket_id = 'dealership-onboarding-intakes')
with check (bucket_id = 'dealership-onboarding-intakes');

create policy "dealership_onboarding_intakes_storage_delete_service"
on storage.objects
for delete
to service_role
using (bucket_id = 'dealership-onboarding-intakes');
