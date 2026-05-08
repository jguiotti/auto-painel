/*
  migration: storefront layout template id per dealership (customer-site shells)
  affected: public.dealerships.layout_id
*/

alter table public.dealerships
  add column if not exists layout_id smallint not null default 1;

alter table public.dealerships
  drop constraint if exists dealerships_layout_id_check;

alter table public.dealerships
  add constraint dealerships_layout_id_check check (layout_id in (1, 2, 3));

comment on column public.dealerships.layout_id is
  'Public storefront structure variant (1–3). Theme remains theme_config / theme_settings.';
