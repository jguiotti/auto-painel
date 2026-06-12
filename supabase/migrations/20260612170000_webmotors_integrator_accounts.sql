-- WebMotors integrator CRM credentials (encrypted) for password-grant token refresh/reconnect.
-- iCarros will reuse the same table when api.icarros.com.br password flow is enabled.

create table if not exists public.dealership_classifieds_integrator_accounts (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships (id) on delete cascade,
  provider text not null check (provider in ('webmotors', 'icarros')),
  integrator_username text not null,
  integrator_password_encrypted text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dealership_classifieds_integrator_accounts_unique unique (dealership_id, provider)
);

comment on table public.dealership_classifieds_integrator_accounts is
  'Encrypted integrator CRM username/password per dealership for password-grant classifieds providers (WebMotors, future iCarros).';

create index if not exists dealership_classifieds_integrator_accounts_dealership_idx
  on public.dealership_classifieds_integrator_accounts (dealership_id, provider);

drop trigger if exists trg_dealership_classifieds_integrator_accounts_updated_at
  on public.dealership_classifieds_integrator_accounts;
create trigger trg_dealership_classifieds_integrator_accounts_updated_at
before update on public.dealership_classifieds_integrator_accounts
for each row
execute function public.set_updated_at_timestamp();

alter table public.dealership_classifieds_integrator_accounts enable row level security;

create policy "dealership_classifieds_integrator_accounts_deny_select"
on public.dealership_classifieds_integrator_accounts
for select
to anon, authenticated
using (false);

create policy "dealership_classifieds_integrator_accounts_deny_insert"
on public.dealership_classifieds_integrator_accounts
for insert
to anon, authenticated
with check (false);

create policy "dealership_classifieds_integrator_accounts_deny_update"
on public.dealership_classifieds_integrator_accounts
for update
to anon, authenticated
using (false)
with check (false);

create policy "dealership_classifieds_integrator_accounts_deny_delete"
on public.dealership_classifieds_integrator_accounts
for delete
to anon, authenticated
using (false);

-- disconnect RPC — also clear integrator accounts
create or replace function private.disconnect_dealership_classifieds_connection_impl(p_provider text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dealership_id uuid;
begin
  if p_provider is null or p_provider not in ('olx', 'webmotors', 'icarros') then
    raise exception 'Provedor inválido.';
  end if;

  select p.dealership_id
    into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_dealership_id is null then
    raise exception 'Não autorizado.';
  end if;

  delete from public.dealership_classifieds_integrator_accounts as ia
  where ia.dealership_id = v_dealership_id
    and ia.provider = p_provider;

  delete from public.dealership_classifieds_credentials as cred
  using public.dealership_classifieds_connections as conn
  where cred.connection_id = conn.id
    and conn.dealership_id = v_dealership_id
    and conn.provider = p_provider;

  update public.dealership_classifieds_connections as conn
  set
    status = 'disconnected',
    token_expires_at = null,
    connected_at = null,
    last_error = null,
    updated_at = now()
  where conn.dealership_id = v_dealership_id
    and conn.provider = p_provider;
end;
$$;
