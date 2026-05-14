-- migration: fix profiles super_admin policy recursion
-- purpose:
--   - remove recursive dependency introduced by profiles policy that called
--     public.is_platform_super_admin(), which itself reads public.profiles
--   - keep super_admin visibility over profiles without self-referential rls
-- affected objects:
--   - policy "profiles_select_super_admin" on public.profiles

drop policy if exists "profiles_select_super_admin" on public.profiles;

create policy "profiles_select_super_admin"
on public.profiles
for select
to authenticated
using ((select private.current_profile_role()) = 'super_admin');
