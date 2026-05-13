/*
  migration: ensure public.dealerships theme/content/feature json columns for admin create/update
  purpose:
    - repair environments where 20260423120000_admin_rbac_theme_leads.sql was never applied
    - fixes PostgREST error: Could not find the 'content_config' column of 'dealerships' in the schema cache
  affected: public.dealerships
*/

alter table public.dealerships
  add column if not exists theme_config jsonb not null default '{}'::jsonb;

alter table public.dealerships
  add column if not exists content_config jsonb not null default '{}'::jsonb;

alter table public.dealerships
  add column if not exists enabled_features text[] not null default '{}'::text[];

comment on column public.dealerships.theme_config is
  'Whitelabel: primary_color, secondary_color, logo_url, favicon_url (hex + URLs).';

comment on column public.dealerships.content_config is
  'Institutional copy: about_text, address, social_links (json object).';

comment on column public.dealerships.enabled_features is
  'Optional modules enabled for the dealership panel; empty may mean legacy «all active» semantics.';
