/*
  migration: public storage bucket for dealership logo/favicon (admin-master uploads via service role)
  affected: storage.buckets, storage.objects policies
*/

insert into storage.buckets (id, name, public)
values ('dealership-branding', 'dealership-branding', true)
on conflict (id) do nothing;

drop policy if exists "dealership_branding_select_public" on storage.objects;

create policy "dealership_branding_select_public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'dealership-branding');
