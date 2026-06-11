/*
  migration: public storage bucket for rendered social carousel slides (1080x1080)
  purpose: Edge worker and Next render route upload JPEG artifacts for Meta Graph API
*/

insert into storage.buckets (id, name, public)
values ('social-carousel-artifacts', 'social-carousel-artifacts', true)
on conflict (id) do update
set public = excluded.public;

-- Service role uploads from render route; public read for Meta crawlers
create policy "social_carousel_artifacts_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'social-carousel-artifacts');

create policy "social_carousel_artifacts_service_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'social-carousel-artifacts'
  and (select auth.role()) = 'service_role'
);

create policy "social_carousel_artifacts_service_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'social-carousel-artifacts'
  and (select auth.role()) = 'service_role'
)
with check (
  bucket_id = 'social-carousel-artifacts'
  and (select auth.role()) = 'service_role'
);

create policy "social_carousel_artifacts_service_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'social-carousel-artifacts'
  and (select auth.role()) = 'service_role'
);
