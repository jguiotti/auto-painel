/*
  migration: platform-wide OLX/WebMotors OAuth settings + disconnect RPC for dealership panel
  purpose:
    - allow AutoPainel ops to enable classifieds OAuth once for all dealerships (non-technical users only click Conectar)
    - tenant-safe disconnect from JWT without exposing credentials tables
  affected: public.platform_classifieds_oauth_providers, public.disconnect_dealership_classifieds_connection
*/

-- ---------------------------------------------------------------------------
-- platform oauth providers (service_role / edge only; no jwt read)
-- ---------------------------------------------------------------------------

create table if not exists public.platform_classifieds_oauth_providers (
  provider text primary key check (provider in ('olx', 'webmotors')),
  is_enabled boolean not null default false,
  authorization_url text,
  token_url text,
  oauth_client_id text,
  oauth_client_secret_encrypted text,
  scope text,
  redirect_uri text,
  updated_at timestamptz not null default now()
);

comment on table public.platform_classifieds_oauth_providers is
  'Platform-managed OAuth2 apps for OLX and WebMotors; when enabled, dealerships connect via popup without technical setup.';

alter table public.platform_classifieds_oauth_providers enable row level security;

create policy "platform_classifieds_oauth_providers_deny_anon_authenticated_select"
on public.platform_classifieds_oauth_providers
for select
to anon, authenticated
using (false);

create policy "platform_classifieds_oauth_providers_deny_anon_authenticated_insert"
on public.platform_classifieds_oauth_providers
for insert
to anon, authenticated
with check (false);

create policy "platform_classifieds_oauth_providers_deny_anon_authenticated_update"
on public.platform_classifieds_oauth_providers
for update
to anon, authenticated
using (false)
with check (false);

create policy "platform_classifieds_oauth_providers_deny_anon_authenticated_delete"
on public.platform_classifieds_oauth_providers
for delete
to anon, authenticated
using (false);

drop trigger if exists trg_platform_classifieds_oauth_providers_updated_at
  on public.platform_classifieds_oauth_providers;
create trigger trg_platform_classifieds_oauth_providers_updated_at
before update on public.platform_classifieds_oauth_providers
for each row
execute function public.set_updated_at_timestamp();

insert into public.platform_classifieds_oauth_providers (provider, is_enabled)
values
  ('olx', false),
  ('webmotors', false)
on conflict (provider) do nothing;

-- ---------------------------------------------------------------------------
-- disconnect classifieds connection for caller dealership
-- ---------------------------------------------------------------------------

create or replace function private.disconnect_dealership_classifieds_connection_impl(p_provider text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dealership_id uuid;
begin
  if p_provider is null or p_provider not in ('olx', 'webmotors') then
    raise exception 'Provedor inválido.';
  end if;

  select p.dealership_id
    into v_dealership_id
  from public.profiles as p
  where p.id = (select auth.uid());

  if v_dealership_id is null then
    raise exception 'Não autorizado.';
  end if;

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

create or replace function public.disconnect_dealership_classifieds_connection(p_provider text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.disconnect_dealership_classifieds_connection_impl(p_provider);
end;
$$;

comment on function public.disconnect_dealership_classifieds_connection(text) is
  'Clears classifieds OAuth tokens and resets connection status for the caller dealership and provider.';

revoke all on function private.disconnect_dealership_classifieds_connection_impl(text) from public;
grant execute on function private.disconnect_dealership_classifieds_connection_impl(text) to authenticated, service_role;

revoke all on function public.disconnect_dealership_classifieds_connection(text) from public;
grant execute on function public.disconnect_dealership_classifieds_connection(text) to authenticated;
