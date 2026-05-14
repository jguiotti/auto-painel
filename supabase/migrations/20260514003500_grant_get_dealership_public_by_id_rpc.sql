-- migration: restore execute grants for storefront public rpc
-- purpose:
--   - ensure customer-site can resolve dealership public record by id with anon/authenticated roles
-- affected objects:
--   - function public.get_dealership_public_by_id(uuid)

revoke all on function public.get_dealership_public_by_id(uuid) from public;
grant execute on function public.get_dealership_public_by_id(uuid) to anon, authenticated;
