-- migration: allow super_admin to delete dealership support / upgrade requests
-- affected: public.dealership_support_requests

create policy "dealership_support_requests_delete_super_admin"
on public.dealership_support_requests
for delete
to authenticated
using ((select public.is_platform_super_admin()));

create or replace function public.delete_dealership_support_request(p_request_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select public.is_platform_super_admin()) then
    raise exception 'unauthorized';
  end if;

  delete from public.dealership_support_requests as r
  where r.id = p_request_id;
end;
$$;

comment on function public.delete_dealership_support_request(uuid) is
  'Platform super_admin: removes a support or upgrade request from the operational queue.';

revoke all on function public.delete_dealership_support_request(uuid) from public;
grant execute on function public.delete_dealership_support_request(uuid) to authenticated;

create or replace function public.resolve_dealership_support_request(
  p_request_id uuid,
  p_status text default 'done'
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select public.is_platform_super_admin()) then
    raise exception 'unauthorized';
  end if;

  if p_status is null or p_status not in ('in_progress', 'done') then
    raise exception 'invalid_status';
  end if;

  update public.dealership_support_requests as r
  set
    status = p_status,
    updated_at = now()
  where r.id = p_request_id;
end;
$$;

comment on function public.resolve_dealership_support_request(uuid, text) is
  'Platform super_admin: marks a support request in_progress or done.';

revoke all on function public.resolve_dealership_support_request(uuid, text) from public;
grant execute on function public.resolve_dealership_support_request(uuid, text) to authenticated;
