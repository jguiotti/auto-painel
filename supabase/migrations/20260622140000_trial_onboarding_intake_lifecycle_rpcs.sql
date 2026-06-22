/*
  migration: trial onboarding intake lifecycle RPCs
  purpose:
    - mark intake converted after admin creates dealership
    - archive intakes; fetch by prospect for CRM
    - index converted_dealership_id for admin lookups
  affected: public.dealership_onboarding_intakes, public.saas_prospects
*/

create index if not exists dealership_onboarding_intakes_converted_dealership_id_idx
  on public.dealership_onboarding_intakes (converted_dealership_id)
  where converted_dealership_id is not null;

-- ---------------------------------------------------------------------------
-- rpc: mark intake converted (platform admin, post createDealership)
-- ---------------------------------------------------------------------------

create or replace function public.mark_dealership_onboarding_intake_converted(
  p_intake_id uuid,
  p_dealership_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing uuid;
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
    from public.dealerships as d
    where d.id = p_dealership_id
  ) then
    raise exception 'dealership_not_found';
  end if;

  select i.converted_dealership_id
  into v_existing
  from public.dealership_onboarding_intakes as i
  where i.id = p_intake_id;

  if v_existing is not null and v_existing <> p_dealership_id then
    raise exception 'intake_already_converted';
  end if;

  update public.dealership_onboarding_intakes as i
  set
    status = 'converted',
    converted_dealership_id = p_dealership_id,
    updated_at = now()
  where i.id = p_intake_id;

  update public.saas_prospects as sp
  set
    pipeline_status = 'won',
    updated_at = now(),
    metadata = coalesce(sp.metadata, '{}'::jsonb) || jsonb_build_object(
      'converted_dealership_id', p_dealership_id,
      'intake_id', p_intake_id
    )
  where sp.id = (
    select i.saas_prospect_id
    from public.dealership_onboarding_intakes as i
    where i.id = p_intake_id
  );
end;
$$;

comment on function public.mark_dealership_onboarding_intake_converted(uuid, uuid) is
  'Platform admin: links intake to created dealership; advances linked saas_prospect to won.';

revoke all on function public.mark_dealership_onboarding_intake_converted(uuid, uuid) from public;
grant execute on function public.mark_dealership_onboarding_intake_converted(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- rpc: archive intake (platform admin)
-- ---------------------------------------------------------------------------

create or replace function public.archive_dealership_onboarding_intake(
  p_intake_id uuid
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
      and i.status <> 'converted'
  ) then
    raise exception 'intake_not_archivable';
  end if;

  update public.dealership_onboarding_intakes as i
  set
    status = 'archived',
    updated_at = now()
  where i.id = p_intake_id;
end;
$$;

comment on function public.archive_dealership_onboarding_intake(uuid) is
  'Platform admin: archives a non-converted onboarding intake.';

revoke all on function public.archive_dealership_onboarding_intake(uuid) from public;
grant execute on function public.archive_dealership_onboarding_intake(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- rpc: lookup intake id by saas_prospect (platform admin CRM)
-- ---------------------------------------------------------------------------

create or replace function public.get_dealership_onboarding_intake_id_for_prospect(
  p_saas_prospect_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select i.id
  from public.dealership_onboarding_intakes as i
  where i.saas_prospect_id = p_saas_prospect_id
  order by i.created_at desc
  limit 1;
$$;

comment on function public.get_dealership_onboarding_intake_id_for_prospect(uuid) is
  'Platform admin: latest onboarding intake linked to a B2B prospect.';

revoke all on function public.get_dealership_onboarding_intake_id_for_prospect(uuid) from public;
grant execute on function public.get_dealership_onboarding_intake_id_for_prospect(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- rpc: update intake payload (service role / post-upload merge)
-- ---------------------------------------------------------------------------

create or replace function public.update_dealership_onboarding_intake_payload(
  p_intake_id uuid,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_payload is null or p_payload = '{}'::jsonb then
    raise exception 'payload_required';
  end if;

  if not exists (
    select 1
    from public.dealership_onboarding_intakes as i
    where i.id = p_intake_id
      and i.status in ('submitted', 'linked')
  ) then
    raise exception 'intake_not_updatable';
  end if;

  update public.dealership_onboarding_intakes as i
  set
    payload = p_payload,
    updated_at = now()
  where i.id = p_intake_id;
end;
$$;

comment on function public.update_dealership_onboarding_intake_payload(uuid, jsonb) is
  'Merges asset URLs into intake payload after marketing upload (service_role or trusted server).';

revoke all on function public.update_dealership_onboarding_intake_payload(uuid, jsonb) from public;
grant execute on function public.update_dealership_onboarding_intake_payload(uuid, jsonb) to service_role;
