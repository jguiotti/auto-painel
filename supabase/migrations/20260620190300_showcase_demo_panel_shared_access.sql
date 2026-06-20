/*
  migration: shared showcase demo panel access (gestor.demo@autopainel.demo)
  purpose:
    - allow one demo manager credential on demo, demo-2, and demo-3 panel hosts
    - bind profiles.dealership_id to the host dealership on panel entry (RLS stays tenant-scoped)
  affected:
    - rpc: is_showcase_demo_panel_manager, is_showcase_demo_store_dealership, bind_showcase_demo_panel_dealership
  notes:
    - auth user gestor.demo@autopainel.demo via npm run seed:demo-users
    - production: apply migration; user/password already provisioned by seed script
*/

create or replace function public.is_showcase_demo_panel_manager(
  p_user_id uuid default null
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users as u
    where u.id = coalesce(p_user_id, (select auth.uid()))
      and lower(u.email) = 'gestor.demo@autopainel.demo'
  );
$$;

comment on function public.is_showcase_demo_panel_manager(uuid) is
  'True when the user is the shared Meta/showcase demo panel manager (gestor.demo@autopainel.demo).';

grant execute on function public.is_showcase_demo_panel_manager(uuid) to authenticated;
revoke all on function public.is_showcase_demo_panel_manager(uuid) from public;

create or replace function public.is_showcase_demo_store_dealership(
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
    from public.dealerships as d
    where d.id = p_dealership_id
      and d.status = 'active'
      and d.slug in ('demo', 'demo-2', 'demo-3')
  );
$$;

comment on function public.is_showcase_demo_store_dealership(uuid) is
  'True when the dealership is an active marketing showcase demo store (demo, demo-2, demo-3).';

grant execute on function public.is_showcase_demo_store_dealership(uuid) to authenticated;
revoke all on function public.is_showcase_demo_store_dealership(uuid) from public;

create or replace function public.bind_showcase_demo_panel_dealership(
  p_dealership_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    return false;
  end if;

  if not (select public.is_showcase_demo_panel_manager(v_uid)) then
    return false;
  end if;

  if not (select public.is_showcase_demo_store_dealership(p_dealership_id)) then
    return false;
  end if;

  update public.profiles as p
  set dealership_id = p_dealership_id
  where p.id = v_uid;

  return true;
end;
$$;

comment on function public.bind_showcase_demo_panel_dealership(uuid) is
  'Rebinds the shared showcase demo manager profile to the host dealership so tenant RLS applies.';

grant execute on function public.bind_showcase_demo_panel_dealership(uuid) to authenticated;
revoke all on function public.bind_showcase_demo_panel_dealership(uuid) from public;
