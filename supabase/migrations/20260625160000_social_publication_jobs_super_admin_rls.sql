/*
  migration: super_admin access for social_publication_jobs
  purpose: allow platform operators to enqueue/share from any dealership host in dealership-panel
  affected: public.social_publication_jobs (select, insert policies)
*/

create policy "social_publication_jobs_select_super_admin"
on public.social_publication_jobs
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "social_publication_jobs_insert_super_admin"
on public.social_publication_jobs
for insert
to authenticated
with check ((select public.is_platform_super_admin()));
