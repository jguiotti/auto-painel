/*
  migration: admin-master whitelabel columns, profile RBAC (super_admin, owner, seller),
            leads assignment for seller-scoped CRM visibility
  affected: public.dealerships, public.profiles, public.leads, RLS policies
*/

-- ---------------------------------------------------------------------------
-- dealerships: CNPJ + structured whitelabel / content / feature flags
-- ---------------------------------------------------------------------------

alter table public.dealerships
  add column if not exists cnpj text;

alter table public.dealerships
  add column if not exists theme_config jsonb not null default '{}'::jsonb;

alter table public.dealerships
  add column if not exists content_config jsonb not null default '{}'::jsonb;

alter table public.dealerships
  add column if not exists enabled_features text[] not null default '{}'::text[];

comment on column public.dealerships.cnpj is
  'Brazilian company id (CNPJ), digits or formatted; optional.';

comment on column public.dealerships.theme_config is
  'Whitelabel: primary_color, secondary_color, logo_url, favicon_url (hex + URLs).';

comment on column public.dealerships.content_config is
  'Institutional copy: about_text, address, social_links (json object).';

comment on column public.dealerships.enabled_features is
  'Optional modules enabled for the dealership panel (e.g. finance_simulator). Empty = all optional modules on (legacy).';

create unique index if not exists dealerships_cnpj_uidx
  on public.dealerships (cnpj)
  where cnpj is not null and length(trim(cnpj)) > 0;

-- Seed theme_config from legacy theme_settings + logo_url (merge, do not drop extra keys)
update public.dealerships as d
set theme_config =
  coalesce(d.theme_config, '{}'::jsonb)
  || jsonb_strip_nulls(
    jsonb_build_object(
      'primary_color',
      coalesce(
        nullif(trim(d.theme_config ->> 'primary_color'), ''),
        d.theme_settings ->> 'primary',
        '#18181b'
      ),
      'secondary_color',
      coalesce(
        nullif(trim(d.theme_config ->> 'secondary_color'), ''),
        d.theme_settings ->> 'accent',
        '#0d9488'
      ),
      'logo_url',
      coalesce(nullif(trim(d.theme_config ->> 'logo_url'), ''), d.logo_url),
      'favicon_url',
      nullif(trim(d.theme_config ->> 'favicon_url'), '')
    )
  );

-- ---------------------------------------------------------------------------
-- leads: optional assignee for seller-scoped visibility
-- ---------------------------------------------------------------------------

alter table public.leads
  add column if not exists assigned_user_id uuid references auth.users (id) on delete set null;

create index if not exists leads_assigned_user_id_idx
  on public.leads (assigned_user_id)
  where assigned_user_id is not null;

comment on column public.leads.assigned_user_id is
  'Dealership user responsible for the lead; sellers only see rows assigned to themselves.';

-- ---------------------------------------------------------------------------
-- profiles: super_admin (platform), owner (tenant admin), seller
-- ---------------------------------------------------------------------------

alter table public.profiles drop constraint if exists profiles_role_check;

update public.profiles
set role = 'owner'
where role = 'admin';

alter table public.profiles
  alter column dealership_id drop not null;

alter table public.profiles
  add constraint profiles_role_check check (
    role in ('super_admin', 'owner', 'seller')
  );

alter table public.profiles
  add constraint profiles_dealership_scope_check check (
    (role = 'super_admin' and dealership_id is null)
    or (role in ('owner', 'seller') and dealership_id is not null)
  );

comment on column public.profiles.role is
  'super_admin: AutoPainel ops (no tenant). owner: dealership admin. seller: restricted CRM/inventory.';

-- ---------------------------------------------------------------------------
-- RLS: dealerships — only owner may update tenant row
-- ---------------------------------------------------------------------------

drop policy if exists "dealerships_update_authenticated_admin_same_tenant" on public.dealerships;

create policy "dealerships_update_authenticated_owner_same_tenant"
on public.dealerships
for update
to authenticated
using (
  id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'owner'
  )
)
with check (
  id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'owner'
  )
);

-- ---------------------------------------------------------------------------
-- RLS: profiles — peer updates by owner only
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_update_authenticated_admin_peers" on public.profiles;

create policy "profiles_update_authenticated_owner_peers"
on public.profiles
for update
to authenticated
using (
  (select pr.role from public.profiles as pr where pr.id = (select auth.uid())) = 'owner'
  and dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
  and id <> (select auth.uid())
)
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- RLS: leads — owner sees all; seller only assigned to self
-- ---------------------------------------------------------------------------

drop policy if exists "leads_select_authenticated_same_tenant" on public.leads;

create policy "leads_select_authenticated_owner_same_tenant"
on public.leads
for select
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
  and (select pr.role from public.profiles as pr where pr.id = (select auth.uid())) = 'owner'
);

create policy "leads_select_authenticated_seller_assigned"
on public.leads
for select
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
  and (select pr.role from public.profiles as pr where pr.id = (select auth.uid())) = 'seller'
  and assigned_user_id = (select auth.uid())
);

-- ---------------------------------------------------------------------------
-- RLS: leads — owner updates any tenant lead; seller updates only assigned rows
-- ---------------------------------------------------------------------------

drop policy if exists "leads_update_authenticated_same_tenant" on public.leads;

create policy "leads_update_authenticated_owner_same_tenant"
on public.leads
for update
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
  and (select pr.role from public.profiles as pr where pr.id = (select auth.uid())) = 'owner'
)
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

create policy "leads_update_authenticated_seller_assigned"
on public.leads
for update
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
  and (select pr.role from public.profiles as pr where pr.id = (select auth.uid())) = 'seller'
  and assigned_user_id = (select auth.uid())
)
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
  and assigned_user_id = (select auth.uid())
);

drop policy if exists "leads_delete_authenticated_same_tenant" on public.leads;

create policy "leads_delete_authenticated_owner_same_tenant"
on public.leads
for delete
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
  )
  and (select pr.role from public.profiles as pr where pr.id = (select auth.uid())) = 'owner'
);
