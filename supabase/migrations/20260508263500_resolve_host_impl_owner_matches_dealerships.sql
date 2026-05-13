/*
  migration: align host-resolver DEFINER functions owner with public.dealerships owner
  purpose:
    - SECURITY DEFINER functions run SELECTs on public.dealerships. RLS policies only target
      "authenticated" (and similar); the migration-role (or other) owner of *_impl is often NOT the
      table owner, so no policy applies to that role → RLS denies every row → resolve_* returns null
      even with correct slug/status and correct public INVOKER delegate.
    - fix: set function owner to the same role that owns dealerships (typically postgres on Supabase),
      so the definer runs with table-owner privileges and bypasses RLS for those reads.
*/

do
$$
declare
  v_owner name;
begin
  select pg_get_userbyid(c.relowner)::name
    into strict v_owner
  from pg_catalog.pg_class as c
  inner join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'dealerships'
    and c.relkind = 'r';

  execute format(
    'alter function private.resolve_dealership_id_by_host_impl(text, text) owner to %I',
    v_owner
  );
  execute format(
    'alter function private.resolve_dealership_id_by_host_for_dashboard_impl(text, text) owner to %I',
    v_owner
  );
end;
$$;

comment on function private.resolve_dealership_id_by_host_impl(text, text) is
  'internal: maps host to active dealership id; owner must match public.dealerships for RLS bypass';

comment on function private.resolve_dealership_id_by_host_for_dashboard_impl(text, text) is
  'internal: dashboard host resolver; owner must match public.dealerships for RLS bypass';
