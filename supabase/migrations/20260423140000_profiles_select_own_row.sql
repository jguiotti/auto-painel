/*
  migration: allow authenticated users to read their own profiles row via RLS
  purpose: super_admin has dealership_id null; the existing same-tenant policy uses
           dealership_id = (select ...), where null = null is not true in sql, so
           platform admins could not select their profile after sign-in.
  affected: public.profiles (select policy)
*/

create policy "profiles_select_authenticated_own_row"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));
