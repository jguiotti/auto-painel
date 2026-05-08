/*
  migration: restore execute grant for public dealership slug rpc
  purpose:
    - required by tenant resolution flow in localhost/custom-domain scenarios
*/

grant execute on function public.get_dealership_public_by_slug(text) to anon, authenticated;
