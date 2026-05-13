/*
  migration: ensure public.dealerships.cnpj exists for admin create/update flows
  purpose:
    - repair environments where upstream migrations were skipped or schemas diverged
    - cnpj is optional (nullable text); uniqueness only for non-null non-empty values
  affected: public.dealerships
*/

alter table public.dealerships
  add column if not exists cnpj text;

comment on column public.dealerships.cnpj is
  'Brazilian company id (CNPJ), digits or formatted; optional.';

create unique index if not exists dealerships_cnpj_uidx
  on public.dealerships (cnpj)
  where cnpj is not null and length(trim(cnpj)) > 0;
