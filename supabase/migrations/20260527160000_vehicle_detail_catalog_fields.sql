/*
  migration: vehicle catalog detail fields (webmotors-style registration data)
  affected: public.vehicles
  notes: extends dealership inventory with specs, optional equipment and sale conditions
*/

alter table public.vehicles
  add column if not exists version text,
  add column if not exists fuel_type text,
  add column if not exists transmission text,
  add column if not exists color text,
  add column if not exists body_style text,
  add column if not exists accepts_trade boolean not null default false,
  add column if not exists single_owner boolean not null default false,
  add column if not exists all_revisions_done boolean not null default false,
  add column if not exists factory_warranty boolean not null default false,
  add column if not exists ipva_paid boolean not null default false,
  add column if not exists is_licensed boolean not null default false,
  add column if not exists features text[] not null default '{}'::text[];

comment on column public.vehicles.version is
  'Trim or version label shown on the public vehicle detail page (e.g. GT SELECTSHIFT).';

comment on column public.vehicles.fuel_type is
  'Fuel type label for public catalog (Gasolina, Flex, Elétrico, etc.).';

comment on column public.vehicles.transmission is
  'Transmission label for public catalog (Automática, Manual, CVT, etc.).';

comment on column public.vehicles.color is
  'Exterior color label for public catalog.';

comment on column public.vehicles.body_style is
  'Body style label (Cupê, Sedan, Hatch, etc.).';

comment on column public.vehicles.features is
  'Optional equipment labels selected in the dealership panel (airbag, ar-condicionado, etc.).';
