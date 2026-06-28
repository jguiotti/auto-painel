-- migration: allow super_admin to delete platform admin inbox notifications
-- affected: public.platform_admin_notifications

create policy "platform_admin_notifications_delete_super_admin"
on public.platform_admin_notifications
for delete
to authenticated
using ((select public.is_platform_super_admin()));

create or replace function public.delete_platform_admin_notification(p_notification_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select public.is_platform_super_admin()) then
    raise exception 'unauthorized';
  end if;

  delete from public.platform_admin_notifications as n
  where n.id = p_notification_id;
end;
$$;

comment on function public.delete_platform_admin_notification(uuid) is
  'Platform super_admin: permanently removes an inbox notification.';

revoke all on function public.delete_platform_admin_notification(uuid) from public;
grant execute on function public.delete_platform_admin_notification(uuid) to authenticated;
