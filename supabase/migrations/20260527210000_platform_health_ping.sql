/*
  migration: platform health ping (keep-alive)
  purpose:
    - lightweight RPC for scheduled pings against hosted Supabase (prevents free-tier pause)
    - optional audit row in platform_health_ping_log (service role / edge only)
*/

create table if not exists public.platform_health_ping_log (
  id bigint generated always as identity primary key,
  source text not null,
  ok boolean not null default true,
  latency_ms integer,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.platform_health_ping_log is
  'Append-only audit of scheduled Supabase keep-alive pings (operators / cron).';

create index if not exists platform_health_ping_log_created_at_idx
  on public.platform_health_ping_log (created_at desc);

alter table public.platform_health_ping_log enable row level security;

create policy "platform_health_ping_log_select_super_admin"
on public.platform_health_ping_log
for select
to authenticated
using ((select public.is_platform_super_admin()));

create or replace function public.platform_health_ping()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'ok', true,
    'pinged_at', now()::text,
    'database', 'connected'
  );
$$;

comment on function public.platform_health_ping() is
  'Harmless keep-alive: returns server timestamp. Callable by anon for external cron.';

create or replace function public.record_platform_health_ping(
  p_source text,
  p_ok boolean,
  p_latency_ms integer default null,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.platform_health_ping_log (
    source,
    ok,
    latency_ms,
    details
  )
  values (
    left(trim(coalesce(p_source, 'unknown')), 64),
    coalesce(p_ok, false),
    p_latency_ms,
    coalesce(p_details, '{}'::jsonb)
  );
end;
$$;

comment on function public.record_platform_health_ping(text, boolean, integer, jsonb) is
  'Internal: append health ping audit row. Execute via service role or edge function.';

revoke all on function public.record_platform_health_ping(text, boolean, integer, jsonb) from public;
grant execute on function public.record_platform_health_ping(text, boolean, integer, jsonb)
  to service_role;

revoke all on function public.platform_health_ping() from public;
grant execute on function public.platform_health_ping() to anon, authenticated, service_role;
