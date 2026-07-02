-- migration: enqueue social jobs with predetermined id + pre-rendered slide URLs from panel
-- affected: public.enqueue_social_publication_job

create or replace function public.enqueue_social_publication_job(
  p_vehicle_id uuid,
  p_channels text[],
  p_artifact_template text,
  p_payload_snapshot jsonb,
  p_trigger_source text default 'manual_share',
  p_job_id uuid default null,
  p_step_payload jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dealership_id uuid;
  v_job_id uuid;
  v_existing_id uuid;
  v_published_id uuid;
begin
  if p_trigger_source not in ('manual_share', 'vehicle_save') then
    raise exception 'invalid trigger_source';
  end if;

  if p_artifact_template not in ('classic', 'performance', 'tech') then
    raise exception 'invalid artifact_template';
  end if;

  if coalesce(array_length(p_channels, 1), 0) = 0 then
    raise exception 'channels required';
  end if;

  if not (
    p_channels <@ array['instagram_feed', 'facebook_page']::text[]
  ) then
    raise exception 'invalid channels';
  end if;

  select v.dealership_id
  into v_dealership_id
  from public.vehicles as v
  where v.id = p_vehicle_id;

  if v_dealership_id is null then
    raise exception 'vehicle not found';
  end if;

  if not exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and (
        p.role = 'super_admin'
        or p.dealership_id = v_dealership_id
      )
  ) then
    raise exception 'unauthorized';
  end if;

  select j.id
  into v_published_id
  from public.social_publication_jobs as j
  where j.vehicle_id = p_vehicle_id
    and j.status = 'published'
    and j.channels && p_channels
  order by j.published_at desc nulls last, j.created_at desc
  limit 1;

  if v_published_id is not null then
    return jsonb_build_object(
      'created', false,
      'already_published', true,
      'job_id', v_published_id
    );
  end if;

  select j.id
  into v_existing_id
  from public.social_publication_jobs as j
  where j.vehicle_id = p_vehicle_id
    and j.status in ('queued', 'rendering', 'uploading_meta', 'failed_partial')
    and j.channels && p_channels
  order by j.created_at desc
  limit 1;

  if v_existing_id is not null then
    return jsonb_build_object(
      'created', false,
      'pending_job', true,
      'job_id', v_existing_id
    );
  end if;

  v_job_id := coalesce(p_job_id, gen_random_uuid());

  insert into public.social_publication_jobs (
    id,
    dealership_id,
    vehicle_id,
    channels,
    artifact_template,
    payload_snapshot,
    step_payload,
    status,
    trigger_source,
    created_by
  )
  values (
    v_job_id,
    v_dealership_id,
    p_vehicle_id,
    p_channels,
    p_artifact_template,
    coalesce(p_payload_snapshot, '{}'::jsonb),
    p_step_payload,
    'queued',
    p_trigger_source,
    (select auth.uid())
  );

  return jsonb_build_object(
    'created', true,
    'job_id', v_job_id
  );
end;
$$;

comment on function public.enqueue_social_publication_job(uuid, text[], text, jsonb, text, uuid, jsonb) is
  'Enqueues a social publication job with optional pre-rendered slides in step_payload.';

revoke all on function public.enqueue_social_publication_job(uuid, text[], text, jsonb, text, uuid, jsonb) from public;
grant execute on function public.enqueue_social_publication_job(uuid, text[], text, jsonb, text, uuid, jsonb) to authenticated;
