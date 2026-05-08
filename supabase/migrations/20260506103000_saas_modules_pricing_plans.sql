/*
  migration: dynamic SaaS modules catalog + pricing plans + dealership.plan FK
  purpose:
    - master module list (saas_modules) and plans (pricing_plans) with pivot (pricing_plan_modules)
    - dealerships.pricing_plan_id optional FK; legacy enabled_features + subscription_plan unchanged
    - RPC effective_feature_keys_for_active_dealership merges plan modules vs legacy semantics
    - trigger blocks tenant owners from mutating pricing_plan_id / enabled_features
    - drops fixed subscription_plan CHECK so operators can store custom labels later
*/

-- ---------------------------------------------------------------------------
-- drop legacy subscription_plan enum-style constraint (plans are dynamic now)
-- ---------------------------------------------------------------------------

alter table public.dealerships
  drop constraint if exists dealerships_subscription_plan_check;

comment on column public.dealerships.subscription_plan is
  'Billing label / legacy slug (trial, starter, etc.); optional mirror of commercial tier; may diverge from pricing_plan_id.';

-- ---------------------------------------------------------------------------
-- saas_modules: master catalog
-- ---------------------------------------------------------------------------

create table public.saas_modules (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  display_name text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint saas_modules_key_key unique (key)
);

comment on table public.saas_modules is
  'Master catalog of platform modules toggled via pricing plans (operator-managed).';

create index saas_modules_active_sort_idx
  on public.saas_modules (is_active, sort_order);

-- ---------------------------------------------------------------------------
-- pricing_plans + pivot
-- ---------------------------------------------------------------------------

create table public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  price_amount numeric(14, 2) not null default 0,
  currency_code text not null default 'BRL',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pricing_plans_slug_key unique (slug)
);

comment on table public.pricing_plans is
  'Commercial pricing plans built by operators; modules attached via pricing_plan_modules.';

create table public.pricing_plan_modules (
  pricing_plan_id uuid not null references public.pricing_plans (id) on delete cascade,
  module_id uuid not null references public.saas_modules (id) on delete restrict,
  primary key (pricing_plan_id, module_id)
);

comment on table public.pricing_plan_modules is
  'Modules enabled for a given pricing plan (authoritative when dealership.pricing_plan_id is set).';

create index pricing_plan_modules_module_id_idx
  on public.pricing_plan_modules (module_id);

-- ---------------------------------------------------------------------------
-- dealerships.pricing_plan_id
-- ---------------------------------------------------------------------------

alter table public.dealerships
  add column if not exists pricing_plan_id uuid references public.pricing_plans (id) on delete set null;

create index if not exists dealerships_pricing_plan_id_idx
  on public.dealerships (pricing_plan_id);

comment on column public.dealerships.pricing_plan_id is
  'Optional FK to pricing_plans; when set, effective feature keys resolve from pivot (+ RPC). Tenant users cannot change this column.';

-- ---------------------------------------------------------------------------
-- RLS: catalog tables locked down for tenant JWT (service_role bypasses)
-- ---------------------------------------------------------------------------

alter table public.saas_modules enable row level security;

alter table public.pricing_plans enable row level security;

alter table public.pricing_plan_modules enable row level security;

-- ---------------------------------------------------------------------------
-- seed modules + plans + pivots + backfill dealerships.pricing_plan_id
-- ---------------------------------------------------------------------------

insert into public.saas_modules (key, display_name, description, sort_order, is_active)
values
  (
    'finance_simulator',
    'Simulador de financiamento',
    'Simulação na vitrine e fluxos associados no painel.',
    10,
    true
  ),
  (
    'qr_generator',
    'Gerador de QR Code',
    'QR codes ligados ao catálogo.',
    20,
    true
  ),
  (
    'advanced_metrics',
    'Métricas avançadas',
    'Relatórios e indicadores extras.',
    30,
    true
  ),
  (
    'olx_sync',
    'Integração OLX',
    'Sincronização com OLX (quando disponível).',
    40,
    false
  ),
  (
    'social_media_kit',
    'Kit redes sociais',
    'Ferramentas extras de divulgação social.',
    50,
    false
  );

insert into public.pricing_plans (slug, name, description, price_amount, currency_code, is_active)
values
  ('trial', 'Trial', 'Período de avaliação; módulos núcleo opcionais liberados.', 0, 'BRL', true),
  ('starter', 'Starter', 'Entrada; foco em vitrine + financiamento.', 97, 'BRL', true),
  ('business', 'Business', 'Operação média; financiamento + QR.', 297, 'BRL', true),
  ('enterprise', 'Enterprise', 'Pacote completo dos módulos ativos no catálogo.', 697, 'BRL', true);

insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select pp.id, sm.id
from public.pricing_plans as pp
inner join public.saas_modules as sm on sm.key = 'finance_simulator'
where pp.slug = 'starter';

insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select pp.id, sm.id
from public.pricing_plans as pp
inner join public.saas_modules as sm on sm.key in ('finance_simulator', 'qr_generator')
where pp.slug = 'business';

insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select pp.id, sm.id
from public.pricing_plans as pp
cross join public.saas_modules as sm
where pp.slug in ('trial', 'enterprise')
  and sm.is_active = true;

update public.dealerships as d
set pricing_plan_id = pp.id
from public.pricing_plans as pp
where d.pricing_plan_id is null
  and pp.slug = d.subscription_plan;

-- ---------------------------------------------------------------------------
-- RPC: merged effective module keys (plan wins when pricing_plan_id set)
-- ---------------------------------------------------------------------------

create or replace function public.effective_feature_keys_for_active_dealership(p_dealership_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_plan_id uuid;
  v_ef text[];
  v_active boolean;
  v_keys text[];
begin
  if p_dealership_id is null then
    return '{}'::text[];
  end if;

  select d.pricing_plan_id, d.enabled_features, d.status = 'active'
    into v_plan_id, v_ef, v_active
  from public.dealerships as d
  where d.id = p_dealership_id;

  if not found then
    return '{}'::text[];
  end if;

  if (select auth.role()) = 'anon' then
    if not coalesce(v_active, false) then
      return '{}'::text[];
    end if;
  elsif (select auth.role()) = 'authenticated' then
    if not exists (
      select 1
      from public.profiles as p
      where p.id = (select auth.uid())
        and (
          p.role = 'super_admin'
          or p.dealership_id = p_dealership_id
        )
    ) then
      raise exception 'Não autorizado.';
    end if;
  elsif (select auth.role()) <> 'service_role' then
    raise exception 'Não autorizado.';
  end if;

  if v_plan_id is not null then
    select coalesce(
      array_agg(m.key order by m.sort_order),
      '{}'::text[]
    )
      into v_keys
    from public.pricing_plan_modules as ppm
    inner join public.saas_modules as m on m.id = ppm.module_id
    inner join public.pricing_plans as pp on pp.id = ppm.pricing_plan_id
    where ppm.pricing_plan_id = v_plan_id
      and m.is_active = true
      and pp.is_active = true;

    return coalesce(v_keys, '{}'::text[]);
  end if;

  if coalesce(cardinality(v_ef), 0) = 0 then
    select coalesce(
      array_agg(m.key order by m.sort_order),
      '{}'::text[]
    )
      into v_keys
    from public.saas_modules as m
    where m.is_active = true;

    return coalesce(v_keys, '{}'::text[]);
  end if;

  return v_ef;
end;
$$;

comment on function public.effective_feature_keys_for_active_dealership(uuid) is
  'Returns effective module keys for a dealership: pricing_plan pivot when pricing_plan_id set; else legacy enabled_features (empty = all active catalog modules). Enforces anon/active + tenant scope for authenticated callers.';

revoke all on function public.effective_feature_keys_for_active_dealership(uuid) from public;

grant execute on function public.effective_feature_keys_for_active_dealership(uuid) to anon;

grant execute on function public.effective_feature_keys_for_active_dealership(uuid) to authenticated;

grant execute on function public.effective_feature_keys_for_active_dealership(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- tenant guard: owners cannot change plan linkage or enabled_features slice
-- ---------------------------------------------------------------------------

create or replace function public.dealerships_block_tenant_plan_feature_updates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if (select auth.role()) = 'service_role' then
    return new;
  end if;

  if exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  ) then
    return new;
  end if;

  if new.pricing_plan_id is distinct from old.pricing_plan_id
    or new.enabled_features is distinct from old.enabled_features
  then
    raise exception 'Apenas a equipa AutoPainel pode alterar o plano ou a lista de módulos.';
  end if;

  return new;
end;
$$;

drop trigger if exists dealerships_block_tenant_plan_features_trigger on public.dealerships;

create trigger dealerships_block_tenant_plan_features_trigger
before update on public.dealerships
for each row
execute function public.dealerships_block_tenant_plan_feature_updates();
