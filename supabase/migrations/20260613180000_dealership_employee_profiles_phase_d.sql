/*
  migration: phase D — employee HR profiles, compensation RLS, sales ranking RPC
  purpose:
    - dealership_employee_profiles (1:1 profiles.id) with HR + commission fields
    - is_active gate for panel access (BZ-EMP-003)
    - RPCs for leader-managed upsert and redacted team listing
    - sales ranking from won leads for dashboard
  affected:
    - public.dealership_employee_profiles (new)
    - rpc: list_dealership_employees_for_panel, upsert_dealership_employee_profile, get_dealership_sales_ranking
*/

-- ---------------------------------------------------------------------------
-- dealership_employee_profiles
-- ---------------------------------------------------------------------------

create table if not exists public.dealership_employee_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  full_name text not null,
  phone text,
  cpf text,
  rg text,
  photo_url text,
  address jsonb not null default '{}'::jsonb,
  base_salary numeric(12, 2) check (base_salary is null or base_salary >= 0),
  commission_percent numeric(5, 2) check (
    commission_percent is null
    or (commission_percent >= 0 and commission_percent <= 100)
  ),
  commission_fixed_per_vehicle numeric(12, 2) check (
    commission_fixed_per_vehicle is null or commission_fixed_per_vehicle >= 0
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dealership_employee_profiles_dealership_user_fkey
    unique (dealership_id, user_id)
);

comment on table public.dealership_employee_profiles is
  'Extended HR profile for dealership staff; compensation visible only to leaders and self.';

create index if not exists dealership_employee_profiles_dealership_idx
  on public.dealership_employee_profiles (dealership_id);

create index if not exists dealership_employee_profiles_active_idx
  on public.dealership_employee_profiles (dealership_id, is_active);

drop trigger if exists trg_dealership_employee_profiles_updated_at
  on public.dealership_employee_profiles;
create trigger trg_dealership_employee_profiles_updated_at
before update on public.dealership_employee_profiles
for each row
execute function public.set_updated_at_timestamp();

alter table public.dealership_employee_profiles enable row level security;

-- leaders: full tenant access
create policy "dealership_employee_profiles_select_leader"
on public.dealership_employee_profiles
for select
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = any (array['owner'::text, 'manager'::text, 'super_admin'::text])
  )
);

create policy "dealership_employee_profiles_insert_leader"
on public.dealership_employee_profiles
for insert
to authenticated
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = any (array['owner'::text, 'manager'::text])
  )
);

create policy "dealership_employee_profiles_update_leader"
on public.dealership_employee_profiles
for update
to authenticated
using (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = any (array['owner'::text, 'manager'::text])
  )
)
with check (
  dealership_id = (
    select p.dealership_id
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = any (array['owner'::text, 'manager'::text])
  )
);

-- seller: own row only (read compensation for self)
create policy "dealership_employee_profiles_select_self"
on public.dealership_employee_profiles
for select
to authenticated
using (user_id = (select auth.uid()));

-- super_admin cross-tenant read
create policy "dealership_employee_profiles_select_super_admin"
on public.dealership_employee_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
      and p.dealership_id is null
  )
);

-- ---------------------------------------------------------------------------
-- helper: caller is leader for dealership
-- ---------------------------------------------------------------------------

create or replace function private.is_dealership_leader_for(
  p_dealership_id uuid
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and (
        (p.role = 'super_admin' and p.dealership_id is null)
        or (
          p.dealership_id = p_dealership_id
          and p.role = any (array['owner'::text, 'manager'::text])
        )
      )
  );
$$;

revoke all on function private.is_dealership_leader_for(uuid) from public;
grant execute on function private.is_dealership_leader_for(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- rpc: list employees (redacts compensation for non-leaders viewing peers)
-- ---------------------------------------------------------------------------

create or replace function public.list_dealership_employees_for_panel(
  p_dealership_id uuid
)
returns table (
  user_id uuid,
  role text,
  email text,
  full_name text,
  phone text,
  cpf text,
  rg text,
  photo_url text,
  address jsonb,
  base_salary numeric,
  commission_percent numeric,
  commission_fixed_per_vehicle numeric,
  is_active boolean,
  can_view_compensation boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid;
  v_is_leader boolean;
begin
  v_caller := (select auth.uid());
  if v_caller is null then
    raise exception 'Não autenticado.';
  end if;

  if not exists (
    select 1
    from public.profiles as p
    where p.id = v_caller
      and (
        p.dealership_id = p_dealership_id
        or (p.role = 'super_admin' and p.dealership_id is null)
      )
  ) then
    raise exception 'Sem permissão.';
  end if;

  v_is_leader := private.is_dealership_leader_for(p_dealership_id);

  return query
  select
    p.id as user_id,
    p.role::text,
    u.email::text,
    coalesce(ep.full_name, nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)) as full_name,
    ep.phone,
    case when v_is_leader or p.id = v_caller then ep.cpf else null end as cpf,
    case when v_is_leader or p.id = v_caller then ep.rg else null end as rg,
    ep.photo_url,
    case when v_is_leader or p.id = v_caller then ep.address else '{}'::jsonb end as address,
    case when v_is_leader or p.id = v_caller then ep.base_salary else null end as base_salary,
    case when v_is_leader or p.id = v_caller then ep.commission_percent else null end as commission_percent,
    case when v_is_leader or p.id = v_caller then ep.commission_fixed_per_vehicle else null end as commission_fixed_per_vehicle,
    coalesce(ep.is_active, true) as is_active,
    (v_is_leader or p.id = v_caller) as can_view_compensation
  from public.profiles as p
  inner join auth.users as u on u.id = p.id
  left join public.dealership_employee_profiles as ep on ep.user_id = p.id
  where p.dealership_id = p_dealership_id
    and p.role = any (array['owner'::text, 'manager'::text, 'seller'::text])
  order by
    case p.role
      when 'owner' then 1
      when 'manager' then 2
      else 3
    end,
    full_name;
end;
$$;

comment on function public.list_dealership_employees_for_panel(uuid) is
  'Team directory for dealership panel; compensation redacted unless leader or self.';

grant execute on function public.list_dealership_employees_for_panel(uuid) to authenticated;

revoke all on function public.list_dealership_employees_for_panel(uuid) from public;

-- ---------------------------------------------------------------------------
-- rpc: upsert employee profile (leaders only)
-- ---------------------------------------------------------------------------

create or replace function public.upsert_dealership_employee_profile(
  p_user_id uuid,
  p_full_name text,
  p_phone text default null,
  p_cpf text default null,
  p_rg text default null,
  p_photo_url text default null,
  p_address jsonb default '{}'::jsonb,
  p_base_salary numeric default null,
  p_commission_percent numeric default null,
  p_commission_fixed_per_vehicle numeric default null,
  p_is_active boolean default true
)
returns public.dealership_employee_profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dealership_id uuid;
  v_row public.dealership_employee_profiles;
  v_name text;
begin
  select p.dealership_id
  into v_dealership_id
  from public.profiles as p
  where p.id = p_user_id
    and p.dealership_id is not null;

  if v_dealership_id is null then
    raise exception 'Colaborador não encontrado.';
  end if;

  if not private.is_dealership_leader_for(v_dealership_id) then
    raise exception 'Apenas gestores podem editar perfis da equipe.';
  end if;

  v_name := nullif(trim(p_full_name), '');
  if v_name is null then
    raise exception 'Informe o nome completo.';
  end if;

  insert into public.dealership_employee_profiles (
    user_id,
    dealership_id,
    full_name,
    phone,
    cpf,
    rg,
    photo_url,
    address,
    base_salary,
    commission_percent,
    commission_fixed_per_vehicle,
    is_active
  )
  values (
    p_user_id,
    v_dealership_id,
    v_name,
    nullif(trim(p_phone), ''),
    nullif(trim(p_cpf), ''),
    nullif(trim(p_rg), ''),
    nullif(trim(p_photo_url), ''),
    coalesce(p_address, '{}'::jsonb),
    p_base_salary,
    p_commission_percent,
    p_commission_fixed_per_vehicle,
    coalesce(p_is_active, true)
  )
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    cpf = excluded.cpf,
    rg = excluded.rg,
    photo_url = excluded.photo_url,
    address = excluded.address,
    base_salary = excluded.base_salary,
    commission_percent = excluded.commission_percent,
    commission_fixed_per_vehicle = excluded.commission_fixed_per_vehicle,
    is_active = excluded.is_active,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.upsert_dealership_employee_profile(
  uuid, text, text, text, text, text, jsonb, numeric, numeric, numeric, boolean
) to authenticated;

-- ---------------------------------------------------------------------------
-- rpc: sales ranking (won leads per assignee)
-- ---------------------------------------------------------------------------

create or replace function public.get_dealership_sales_ranking(
  p_dealership_id uuid,
  p_days integer default 30
)
returns table (
  user_id uuid,
  full_name text,
  role text,
  won_leads_count bigint,
  estimated_commission numeric,
  can_view_compensation boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_leader boolean;
  v_caller uuid;
  v_since timestamptz;
begin
  v_caller := (select auth.uid());
  if v_caller is null then
    raise exception 'Não autenticado.';
  end if;

  v_is_leader := private.is_dealership_leader_for(p_dealership_id);
  v_since := now() - make_interval(days => greatest(coalesce(p_days, 30), 1));

  return query
  with won as (
    select
      l.assigned_user_id as uid,
      count(*)::bigint as cnt,
      coalesce(
        sum(
          coalesce(v.sale_price, v.price, 0)
          * coalesce(ep.commission_percent, 0) / 100.0
          + coalesce(ep.commission_fixed_per_vehicle, 0)
        ),
        0
      )::numeric as est_comm
    from public.leads as l
    left join public.vehicles as v on v.id = l.converted_vehicle_id
    left join public.dealership_employee_profiles as ep on ep.user_id = l.assigned_user_id
    where l.dealership_id = p_dealership_id
      and l.status = 'won'
      and l.created_at >= v_since
      and l.assigned_user_id is not null
    group by l.assigned_user_id
  )
  select
    p.id as user_id,
    coalesce(ep.full_name, split_part(u.email, '@', 1)) as full_name,
    p.role::text,
    coalesce(w.cnt, 0)::bigint as won_leads_count,
    case when v_is_leader or p.id = v_caller then coalesce(w.est_comm, 0) else null end as estimated_commission,
    (v_is_leader or p.id = v_caller) as can_view_compensation
  from public.profiles as p
  inner join auth.users as u on u.id = p.id
  left join public.dealership_employee_profiles as ep on ep.user_id = p.id
  left join won as w on w.uid = p.id
  where p.dealership_id = p_dealership_id
    and p.role = any (array['owner'::text, 'manager'::text, 'seller'::text])
    and coalesce(ep.is_active, true) = true
  order by won_leads_count desc, full_name asc;
end;
$$;

grant execute on function public.get_dealership_sales_ranking(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- rpc: is panel user active (for session gate)
-- ---------------------------------------------------------------------------

create or replace function public.is_dealership_panel_user_active(
  p_user_id uuid default null
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (
      select ep.is_active
      from public.dealership_employee_profiles as ep
      where ep.user_id = coalesce(p_user_id, (select auth.uid()))
    ),
    true
  );
$$;

grant execute on function public.is_dealership_panel_user_active(uuid) to authenticated;
