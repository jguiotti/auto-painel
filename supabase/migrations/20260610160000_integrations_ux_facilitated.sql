/*
  migration: integrations ux facilitated — carousel settings, meta page picker, listing urls
  purpose:
    - store per-dealership carousel appearance (template + watermark) for social_media_kit
    - support multi-page Meta OAuth with page_selection_required flow
    - expose external_listing_url on classifieds listings for operator UI
    - enrich social_publication_jobs with published_at and trigger_source
  affected tables:
    - dealership_social_carousel_settings (new)
    - dealership_meta_connections (status + pending_page_candidates)
    - dealership_meta_oauth_sessions (oauth completion metadata)
    - vehicle_classifieds_listings (external_listing_url)
    - social_publication_jobs (published_at, trigger_source)
  rpcs:
    - upsert_dealership_social_carousel_settings
    - list_dealership_meta_page_candidates
    - confirm_dealership_meta_page_selection
    - dismiss_integrations_onboarding
*/

-- ---------------------------------------------------------------------------
-- carousel appearance per dealership (social_media_kit)
-- ---------------------------------------------------------------------------

create table if not exists public.dealership_social_carousel_settings (
  dealership_id uuid primary key references public.dealerships (id) on delete cascade,
  artifact_template text not null default 'classic' check (
    artifact_template in ('classic', 'performance', 'tech')
  ),
  watermark_enabled boolean not null default true,
  integrations_onboarding_dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.dealership_social_carousel_settings is
  'Per-dealership social carousel branding: visual template, logo watermark toggle, onboarding dismiss timestamp.';

drop trigger if exists trg_dealership_social_carousel_settings_updated_at
  on public.dealership_social_carousel_settings;
create trigger trg_dealership_social_carousel_settings_updated_at
before update on public.dealership_social_carousel_settings
for each row
execute function public.set_updated_at_timestamp();

alter table public.dealership_social_carousel_settings enable row level security;

create policy "social_carousel_settings_select_own"
on public.dealership_social_carousel_settings
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_social_carousel_settings.dealership_id
  )
);

create policy "social_carousel_settings_insert_own"
on public.dealership_social_carousel_settings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_social_carousel_settings.dealership_id
  )
);

create policy "social_carousel_settings_update_own"
on public.dealership_social_carousel_settings
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_social_carousel_settings.dealership_id
  )
)
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = dealership_social_carousel_settings.dealership_id
  )
);

-- ---------------------------------------------------------------------------
-- meta connections: page picker pending state
-- ---------------------------------------------------------------------------

alter table public.dealership_meta_connections
  add column if not exists pending_page_candidates jsonb;

comment on column public.dealership_meta_connections.pending_page_candidates is
  'Non-sensitive Facebook Page options awaiting operator selection after OAuth (array of page_id, page_name, instagram fields).';

alter table public.dealership_meta_connections
  drop constraint if exists dealership_meta_connections_status_check;

alter table public.dealership_meta_connections
  add constraint dealership_meta_connections_status_check
  check (
    status in (
      'disconnected',
      'connecting',
      'connected',
      'error',
      'reauth_required',
      'page_selection_required'
    )
  );

-- ---------------------------------------------------------------------------
-- classifieds listings: external url for operator link-out
-- ---------------------------------------------------------------------------

alter table public.vehicle_classifieds_listings
  add column if not exists external_listing_url text;

comment on column public.vehicle_classifieds_listings.external_listing_url is
  'Public URL of the listing on OLX or WebMotors when known after publish.';

-- ---------------------------------------------------------------------------
-- social publication jobs: traceability for vehicle-save vs manual share
-- ---------------------------------------------------------------------------

alter table public.social_publication_jobs
  add column if not exists published_at timestamptz,
  add column if not exists trigger_source text not null default 'manual_share' check (
    trigger_source in ('manual_share', 'vehicle_save')
  );

comment on column public.social_publication_jobs.trigger_source is
  'Whether the job was enqueued from vehicle detail share or vehicle form save-and-promote.';

create index if not exists social_publication_jobs_vehicle_recent_idx
  on public.social_publication_jobs (vehicle_id, created_at desc);

-- ---------------------------------------------------------------------------
-- helper: module gate for social_media_kit
-- ---------------------------------------------------------------------------

create or replace function private.assert_social_media_kit_enabled(
  p_dealership_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (
    'social_media_kit' = any(
      public.effective_feature_keys_for_active_dealership(p_dealership_id)
    )
  ) then
    raise exception 'module_not_enabled';
  end if;
end;
$$;

comment on function private.assert_social_media_kit_enabled(uuid) is
  'Raises module_not_enabled when social_media_kit is not effective for the dealership.';

revoke all on function private.assert_social_media_kit_enabled(uuid) from public;
grant execute on function private.assert_social_media_kit_enabled(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- rpc: upsert carousel settings (tenant-scoped + module gate)
-- ---------------------------------------------------------------------------

create or replace function public.upsert_dealership_social_carousel_settings(
  p_artifact_template text,
  p_watermark_enabled boolean
)
returns public.dealership_social_carousel_settings
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dealership_id uuid;
  v_row public.dealership_social_carousel_settings;
begin
  if p_artifact_template not in ('classic', 'performance', 'tech') then
    raise exception 'invalid_artifact_template';
  end if;

  select p.dealership_id
  into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_dealership_id is null then
    raise exception 'unauthorized';
  end if;

  perform private.assert_social_media_kit_enabled(v_dealership_id);

  insert into public.dealership_social_carousel_settings as s (
    dealership_id,
    artifact_template,
    watermark_enabled
  )
  values (
    v_dealership_id,
    p_artifact_template,
    coalesce(p_watermark_enabled, true)
  )
  on conflict (dealership_id) do update
  set
    artifact_template = excluded.artifact_template,
    watermark_enabled = excluded.watermark_enabled,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.upsert_dealership_social_carousel_settings(text, boolean) is
  'Upserts carousel template and watermark toggle for the caller dealership; requires social_media_kit.';

revoke all on function public.upsert_dealership_social_carousel_settings(text, boolean) from public;
grant execute on function public.upsert_dealership_social_carousel_settings(text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- rpc: list meta page candidates (non-sensitive)
-- ---------------------------------------------------------------------------

create or replace function public.list_dealership_meta_page_candidates()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dealership_id uuid;
  v_candidates jsonb;
begin
  select p.dealership_id
  into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_dealership_id is null then
    raise exception 'unauthorized';
  end if;

  select c.pending_page_candidates
  into v_candidates
  from public.dealership_meta_connections as c
  where c.dealership_id = v_dealership_id
    and c.status = 'page_selection_required';

  return coalesce(v_candidates, '[]'::jsonb);
end;
$$;

comment on function public.list_dealership_meta_page_candidates() is
  'Returns pending Facebook Page options for the caller dealership when OAuth awaits page selection.';

revoke all on function public.list_dealership_meta_page_candidates() from public;
grant execute on function public.list_dealership_meta_page_candidates() to authenticated;

-- page token exchange after operator selection is implemented in dealership-panel
-- server action finalizeMetaPageSelectionAction (service role + Graph API) — see Fase 5

-- ---------------------------------------------------------------------------
-- rpc: dismiss integrations onboarding banner
-- ---------------------------------------------------------------------------

create or replace function public.dismiss_integrations_onboarding()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dealership_id uuid;
begin
  select p.dealership_id
  into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_dealership_id is null then
    raise exception 'unauthorized';
  end if;

  insert into public.dealership_social_carousel_settings (
    dealership_id,
    integrations_onboarding_dismissed_at
  )
  values (
    v_dealership_id,
    now()
  )
  on conflict (dealership_id) do update
  set
    integrations_onboarding_dismissed_at = now(),
    updated_at = now();
end;
$$;

comment on function public.dismiss_integrations_onboarding() is
  'Marks integrations onboarding banner as dismissed for the caller dealership.';

revoke all on function public.dismiss_integrations_onboarding() from public;
grant execute on function public.dismiss_integrations_onboarding() to authenticated;
