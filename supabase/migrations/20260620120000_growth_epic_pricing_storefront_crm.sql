/*
  migration: growth epic — public pricing, inactive storefront tenant, platform CRM, internal stores
  purpose:
    - set commercial plan prices (starter/business/enterprise)
    - resolve storefront tenant by host including non-active (not churned)
    - extend saas_prospects with B2B pipeline fields
    - protect guiotti/demo from billing and destructive status changes
*/

-- ---------------------------------------------------------------------------
-- pricing (marketing-site /planos)
-- ---------------------------------------------------------------------------

update public.pricing_plans
set
  name = 'Essencial',
  description = 'Vitrine, estoque e CRM básico para lojas de até 40 veículos.',
  price_amount = 197,
  updated_at = now()
where slug = 'starter';

update public.pricing_plans
set
  name = 'Profissional',
  description = 'Simulador, QR Code e operação comercial completa.',
  price_amount = 397,
  updated_at = now()
where slug = 'business';

update public.pricing_plans
set
  name = 'Completo',
  description = 'Integrações OLX, WebMotors, iCarros e kit Meta.',
  price_amount = 997,
  updated_at = now()
where slug = 'enterprise';

-- ---------------------------------------------------------------------------
-- internal demo stores (exempt from billing; immutable status)
-- ---------------------------------------------------------------------------

alter table public.dealerships
  add column if not exists billing_exempt boolean not null default false;

comment on column public.dealerships.billing_exempt is
  'When true, dealership is excluded from platform billing metrics (internal demo/reference stores).';

update public.dealerships
set billing_exempt = true
where lower(trim(slug)) in ('guiotti', 'demo');

create or replace function public.enforce_internal_dealership_protection()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(trim(old.slug)) not in ('guiotti', 'demo') then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Internal reference dealerships (guiotti, demo) cannot be deleted.';
  end if;

  if new.status is distinct from old.status and lower(trim(new.status)) <> 'active' then
    raise exception 'Internal reference dealerships (guiotti, demo) must remain active.';
  end if;

  new.billing_exempt := true;
  return new;
end;
$$;

drop trigger if exists trg_dealerships_internal_protection on public.dealerships;

create trigger trg_dealerships_internal_protection
before update or delete on public.dealerships
for each row
execute function public.enforce_internal_dealership_protection();

-- ---------------------------------------------------------------------------
-- storefront tenant resolver (active + suspended + pending_setup; not churned)
-- ---------------------------------------------------------------------------

create or replace function private.resolve_dealership_storefront_tenant_impl(
  p_host text,
  p_platform_root_domain text
)
returns table (
  dealership_id uuid,
  dealership_slug text,
  dealership_name text,
  dealership_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_host text;
  v_root text;
  v_subdomain_slug text;
  v_suffix_len integer;
begin
  perform set_config('row_security', 'off', true);

  if p_host is null or length(trim(p_host)) = 0 then
    return;
  end if;

  v_host := lower(trim(regexp_replace(p_host, ':\\d+$', '')));
  if v_host like 'www.%' then
    v_host := substring(v_host from 5);
  end if;

  return query
  select
    d.id,
    d.slug,
    d.name,
    lower(trim(d.status))
  from public.dealerships as d
  where nullif(trim(d.custom_domain), '') is not null
    and lower(regexp_replace(trim(d.custom_domain), '^www\.', '')) = v_host
    and lower(trim(d.status)) <> 'churned'
  limit 1;

  if found then
    return;
  end if;

  if p_platform_root_domain is null or length(trim(p_platform_root_domain)) = 0 then
    return;
  end if;

  v_root := lower(trim(regexp_replace(p_platform_root_domain, ':\\d+$', '')));

  if v_host = v_root then
    return;
  end if;

  v_suffix_len := char_length(v_root) + 1;
  if char_length(v_host) <= v_suffix_len then
    return;
  end if;

  if right(v_host, v_suffix_len) <> ('.' || v_root) then
    return;
  end if;

  v_subdomain_slug := split_part(v_host, '.', 1);

  return query
  select
    d.id,
    d.slug,
    d.name,
    lower(trim(d.status))
  from public.dealerships as d
  where lower(trim(d.slug)) = v_subdomain_slug
    and lower(trim(d.status)) <> 'churned'
  limit 1;
end;
$$;

create or replace function public.resolve_dealership_storefront_tenant(
  p_host text,
  p_platform_root_domain text
)
returns table (
  dealership_id uuid,
  dealership_slug text,
  dealership_name text,
  dealership_status text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.resolve_dealership_storefront_tenant_impl(p_host, p_platform_root_domain);
$$;

comment on function public.resolve_dealership_storefront_tenant(text, text) is
  'Maps host to dealership tenant for customer-site; includes suspended/pending_setup; excludes churned.';

revoke all on function public.resolve_dealership_storefront_tenant(text, text) from public;
grant execute on function public.resolve_dealership_storefront_tenant(text, text) to anon, authenticated;

create or replace function public.get_dealership_storefront_tenant_by_slug(p_slug text)
returns table (
  dealership_id uuid,
  dealership_slug text,
  dealership_name text,
  dealership_status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    d.id,
    d.slug,
    d.name,
    lower(trim(d.status))
  from public.dealerships as d
  where lower(trim(d.slug)) = lower(trim(p_slug))
    and lower(trim(d.status)) <> 'churned'
  limit 1;
$$;

comment on function public.get_dealership_storefront_tenant_by_slug(text) is
  'Dev storefront tenant by slug (non-churned); used on bare localhost with NEXT_PUBLIC_DEVELOPMENT_TENANT_SLUG.';

revoke all on function public.get_dealership_storefront_tenant_by_slug(text) from public;
grant execute on function public.get_dealership_storefront_tenant_by_slug(text) to anon, authenticated;

create or replace function public.get_dealership_storefront_shell_by_id(p_id uuid)
returns table (
  id uuid,
  name text,
  slug text,
  status text,
  logo_url text,
  theme_settings jsonb,
  theme_config jsonb,
  content_config jsonb,
  layout_id integer,
  contact_email text,
  whatsapp_number text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    d.id,
    d.name,
    d.slug,
    lower(trim(d.status)),
    d.logo_url,
    d.theme_settings,
    d.theme_config,
    d.content_config,
    d.layout_id,
    d.contact_email,
    d.whatsapp_number
  from public.dealerships as d
  where d.id = p_id
    and lower(trim(d.status)) <> 'churned'
  limit 1;
$$;

comment on function public.get_dealership_storefront_shell_by_id(uuid) is
  'Minimal dealership row for inactive storefront shell (any non-churned status).';

revoke all on function public.get_dealership_storefront_shell_by_id(uuid) from public;
grant execute on function public.get_dealership_storefront_shell_by_id(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- platform B2B CRM (saas_prospects pipeline)
-- ---------------------------------------------------------------------------

alter table public.saas_prospects
  add column if not exists pipeline_status text not null default 'new',
  add column if not exists lost_reason_code text,
  add column if not exists lost_reason_note text,
  add column if not exists assigned_user_id uuid references auth.users (id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.saas_prospects
  drop constraint if exists saas_prospects_pipeline_status_check;

alter table public.saas_prospects
  add constraint saas_prospects_pipeline_status_check
  check (
    pipeline_status in (
      'new',
      'qualification',
      'demo_scheduled',
      'demo_done',
      'proposal_sent',
      'negotiation',
      'won',
      'onboarding',
      'lost'
    )
  );

create index if not exists saas_prospects_pipeline_status_idx
  on public.saas_prospects (pipeline_status, created_at desc);

comment on column public.saas_prospects.pipeline_status is
  'Platform sales pipeline stage for B2B leads (admin-master CRM).';

create policy "saas_prospects_select_platform_super_admin"
on public.saas_prospects
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "saas_prospects_update_platform_super_admin"
on public.saas_prospects
for update
to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));
