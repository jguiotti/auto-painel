/*
  migration: sale receipt module — vehicle sale receipts for dealership panel print
  purpose:
    - register saas_modules key sale_receipt (gated add-on)
    - optional license_plate and renavam on vehicles for receipt data
    - persist editable buyer/payment snapshot per sold vehicle (one row per vehicle)
  affected:
    - public.saas_modules, public.pricing_plan_modules
    - public.vehicles (license_plate, renavam)
    - public.vehicle_sale_receipts (new)
  rpcs:
    - upsert_vehicle_sale_receipt
    - get_vehicle_sale_receipt
*/

-- ---------------------------------------------------------------------------
-- saas module
-- ---------------------------------------------------------------------------

insert into public.saas_modules (key, display_name, description, sort_order, is_active)
values (
  'sale_receipt',
  'Recibo de venda',
  'Recibo simples de compra e venda para veículos vendidos (sem validade fiscal).',
  35,
  true
)
on conflict (key) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- enterprise + trial include new module; starter/business unchanged (sold as add-on via plan pivot)
insert into public.pricing_plan_modules (pricing_plan_id, module_id)
select pp.id, sm.id
from public.pricing_plans as pp
inner join public.saas_modules as sm on sm.key = 'sale_receipt'
where pp.slug in ('trial', 'enterprise')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- vehicles: optional plate / renavam for receipt
-- ---------------------------------------------------------------------------

alter table public.vehicles
  add column if not exists license_plate text,
  add column if not exists renavam text;

comment on column public.vehicles.license_plate is
  'License plate (placa) when known; shown on sale receipt.';

comment on column public.vehicles.renavam is
  'RENAVAM when known; shown on sale receipt.';

-- ---------------------------------------------------------------------------
-- sale receipts (one editable record per vehicle)
-- ---------------------------------------------------------------------------

create table if not exists public.vehicle_sale_receipts (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  buyer_name text not null,
  buyer_document text not null,
  buyer_billing_address text not null,
  payment_lines jsonb not null default '[]'::jsonb,
  sale_amount numeric(12, 2) not null check (sale_amount >= 0),
  down_payment_amount numeric(12, 2) check (down_payment_amount is null or down_payment_amount >= 0),
  vehicle_license_plate text,
  vehicle_renavam text,
  vehicle_brand text not null,
  vehicle_model text not null,
  vehicle_version text,
  vehicle_type text not null,
  vehicle_type_custom text,
  vehicle_manufacturing_year integer,
  vehicle_model_year integer,
  vehicle_mileage integer,
  issued_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicle_sale_receipts_vehicle_id_uidx unique (vehicle_id),
  constraint vehicle_sale_receipts_payment_lines_array check (jsonb_typeof(payment_lines) = 'array')
);

comment on table public.vehicle_sale_receipts is
  'Simple internal sale receipt data per sold vehicle; editable; not a fiscal document.';

comment on column public.vehicle_sale_receipts.payment_lines is
  'Array of { method, amount } — methods: cash, pix, card, bank_transfer, financing, trade_in.';

create index if not exists vehicle_sale_receipts_dealership_vehicle_idx
  on public.vehicle_sale_receipts (dealership_id, vehicle_id);

drop trigger if exists trg_vehicle_sale_receipts_updated_at on public.vehicle_sale_receipts;
create trigger trg_vehicle_sale_receipts_updated_at
before update on public.vehicle_sale_receipts
for each row
execute function public.set_updated_at_timestamp();

alter table public.vehicle_sale_receipts enable row level security;

create policy "vehicle_sale_receipts_select_own"
on public.vehicle_sale_receipts
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = vehicle_sale_receipts.dealership_id
  )
);

create policy "vehicle_sale_receipts_insert_own"
on public.vehicle_sale_receipts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = vehicle_sale_receipts.dealership_id
  )
);

create policy "vehicle_sale_receipts_update_own"
on public.vehicle_sale_receipts
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = vehicle_sale_receipts.dealership_id
  )
)
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.dealership_id = vehicle_sale_receipts.dealership_id
  )
);

-- ---------------------------------------------------------------------------
-- helper: module gate
-- ---------------------------------------------------------------------------

create or replace function private.assert_sale_receipt_enabled(
  p_dealership_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (
    'sale_receipt' = any(
      public.effective_feature_keys_for_active_dealership(p_dealership_id)
    )
  ) then
    raise exception 'module_not_enabled';
  end if;
end;
$$;

comment on function private.assert_sale_receipt_enabled(uuid) is
  'Raises module_not_enabled when sale_receipt is not effective for the dealership.';

revoke all on function private.assert_sale_receipt_enabled(uuid) from public;
grant execute on function private.assert_sale_receipt_enabled(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- rpc: upsert sale receipt (vehicle must be sold)
-- ---------------------------------------------------------------------------

create or replace function public.upsert_vehicle_sale_receipt(
  p_vehicle_id uuid,
  p_buyer_name text,
  p_buyer_document text,
  p_buyer_billing_address text,
  p_payment_lines jsonb,
  p_sale_amount numeric,
  p_down_payment_amount numeric default null,
  p_vehicle_license_plate text default null,
  p_vehicle_renavam text default null
)
returns public.vehicle_sale_receipts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dealership_id uuid;
  v_vehicle public.vehicles;
  v_row public.vehicle_sale_receipts;
  v_line jsonb;
  v_method text;
begin
  if p_buyer_name is null or length(trim(p_buyer_name)) = 0 then
    raise exception 'buyer_name_required';
  end if;
  if p_buyer_document is null or length(trim(p_buyer_document)) = 0 then
    raise exception 'buyer_document_required';
  end if;
  if p_buyer_billing_address is null or length(trim(p_buyer_billing_address)) = 0 then
    raise exception 'buyer_billing_address_required';
  end if;
  if p_sale_amount is null or p_sale_amount < 0 then
    raise exception 'invalid_sale_amount';
  end if;
  if p_payment_lines is null or jsonb_typeof(p_payment_lines) <> 'array' or jsonb_array_length(p_payment_lines) = 0 then
    raise exception 'payment_lines_required';
  end if;

  for v_line in
    select value from jsonb_array_elements(p_payment_lines) as t(value)
  loop
    v_method := v_line ->> 'method';
    if v_method is null or v_method not in (
      'cash', 'pix', 'card', 'bank_transfer', 'financing', 'trade_in'
    ) then
      raise exception 'invalid_payment_method';
    end if;
    if (v_line ->> 'amount') is null or (v_line ->> 'amount')::numeric < 0 then
      raise exception 'invalid_payment_amount';
    end if;
  end loop;

  select p.dealership_id
  into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_dealership_id is null then
    raise exception 'unauthorized';
  end if;

  perform private.assert_sale_receipt_enabled(v_dealership_id);

  select *
  into v_vehicle
  from public.vehicles as v
  where v.id = p_vehicle_id
    and v.dealership_id = v_dealership_id;

  if not found then
    raise exception 'vehicle_not_found';
  end if;

  if v_vehicle.status <> 'sold' then
    raise exception 'vehicle_not_sold';
  end if;

  insert into public.vehicle_sale_receipts as r (
    dealership_id,
    vehicle_id,
    buyer_name,
    buyer_document,
    buyer_billing_address,
    payment_lines,
    sale_amount,
    down_payment_amount,
    vehicle_license_plate,
    vehicle_renavam,
    vehicle_brand,
    vehicle_model,
    vehicle_version,
    vehicle_type,
    vehicle_type_custom,
    vehicle_manufacturing_year,
    vehicle_model_year,
    vehicle_mileage,
    issued_by
  )
  values (
    v_dealership_id,
    p_vehicle_id,
    trim(p_buyer_name),
    trim(p_buyer_document),
    trim(p_buyer_billing_address),
    p_payment_lines,
    p_sale_amount,
    p_down_payment_amount,
    nullif(trim(coalesce(p_vehicle_license_plate, v_vehicle.license_plate, '')), ''),
    nullif(trim(coalesce(p_vehicle_renavam, v_vehicle.renavam, '')), ''),
    v_vehicle.brand,
    v_vehicle.model,
    v_vehicle.version,
    v_vehicle.vehicle_type,
    v_vehicle.vehicle_type_custom,
    v_vehicle.manufacturing_year,
    v_vehicle.model_year,
    v_vehicle.mileage,
    (select auth.uid())
  )
  on conflict (vehicle_id) do update
  set
    buyer_name = excluded.buyer_name,
    buyer_document = excluded.buyer_document,
    buyer_billing_address = excluded.buyer_billing_address,
    payment_lines = excluded.payment_lines,
    sale_amount = excluded.sale_amount,
    down_payment_amount = excluded.down_payment_amount,
    vehicle_license_plate = excluded.vehicle_license_plate,
    vehicle_renavam = excluded.vehicle_renavam,
    vehicle_brand = excluded.vehicle_brand,
    vehicle_model = excluded.vehicle_model,
    vehicle_version = excluded.vehicle_version,
    vehicle_type = excluded.vehicle_type,
    vehicle_type_custom = excluded.vehicle_type_custom,
    vehicle_manufacturing_year = excluded.vehicle_manufacturing_year,
    vehicle_model_year = excluded.vehicle_model_year,
    vehicle_mileage = excluded.vehicle_mileage,
    issued_by = (select auth.uid()),
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.upsert_vehicle_sale_receipt(uuid, text, text, text, jsonb, numeric, numeric, text, text) is
  'Creates or updates sale receipt for a sold vehicle; requires sale_receipt module.';

revoke all on function public.upsert_vehicle_sale_receipt(uuid, text, text, text, jsonb, numeric, numeric, text, text) from public;
grant execute on function public.upsert_vehicle_sale_receipt(uuid, text, text, text, jsonb, numeric, numeric, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- rpc: get sale receipt by vehicle
-- ---------------------------------------------------------------------------

create or replace function public.get_vehicle_sale_receipt(
  p_vehicle_id uuid
)
returns public.vehicle_sale_receipts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dealership_id uuid;
  v_row public.vehicle_sale_receipts;
begin
  select p.dealership_id
  into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_dealership_id is null then
    raise exception 'unauthorized';
  end if;

  perform private.assert_sale_receipt_enabled(v_dealership_id);

  select *
  into v_row
  from public.vehicle_sale_receipts as r
  where r.vehicle_id = p_vehicle_id
    and r.dealership_id = v_dealership_id;

  if not found then
    raise exception 'receipt_not_found';
  end if;

  return v_row;
end;
$$;

comment on function public.get_vehicle_sale_receipt(uuid) is
  'Returns sale receipt for vehicle in caller dealership; requires sale_receipt module.';

revoke all on function public.get_vehicle_sale_receipt(uuid) from public;
grant execute on function public.get_vehicle_sale_receipt(uuid) to authenticated;
