/*
  migration: vehicle public slugs, audit timestamps, storage bucket for images
*/

-- ---------------------------------------------------------------------------
-- vehicles: public slug + timestamps
-- ---------------------------------------------------------------------------

alter table public.vehicles
  add column if not exists public_slug text;

alter table public.vehicles
  add column if not exists created_at timestamptz not null default now();

alter table public.vehicles
  add column if not exists updated_at timestamptz not null default now();

update public.vehicles
set public_slug = lower(replace(id::text, '-', ''))
where public_slug is null;

alter table public.vehicles
  alter column public_slug set not null;

alter table public.vehicles
  add constraint vehicles_public_slug_format_check check (
    public_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  );

create unique index if not exists vehicles_dealership_public_slug_uidx
  on public.vehicles (dealership_id, public_slug);

-- ---------------------------------------------------------------------------
-- leads: created_at for sorting
-- ---------------------------------------------------------------------------

alter table public.leads
  add column if not exists created_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- storage: public bucket + policies (first path segment = dealership_id)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('vehicle-images', 'vehicle-images', true)
on conflict (id) do update set public = excluded.public;

-- public bucket: files are viewable via public url; rls select is not granted to anon (avoids bucket listing leakage)

drop policy if exists "vehicle_images_select_public" on storage.objects;
drop policy if exists "vehicle_images_select_authenticated_tenant_folder" on storage.objects;

create policy "vehicle_images_select_authenticated_tenant_folder"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'vehicle-images'
  and (storage.foldername(name))[1] = (
    select p.dealership_id::text
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

drop policy if exists "vehicle_images_insert_authenticated_tenant_folder" on storage.objects;
drop policy if exists "vehicle_images_update_authenticated_tenant_folder" on storage.objects;
drop policy if exists "vehicle_images_delete_authenticated_tenant_folder" on storage.objects;

create policy "vehicle_images_insert_authenticated_tenant_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'vehicle-images'
  and (storage.foldername(name))[1] = (
    select p.dealership_id::text
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

create policy "vehicle_images_update_authenticated_tenant_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'vehicle-images'
  and (storage.foldername(name))[1] = (
    select p.dealership_id::text
    from public.profiles as p
    where p.id = (select auth.uid())
  )
)
with check (
  bucket_id = 'vehicle-images'
  and (storage.foldername(name))[1] = (
    select p.dealership_id::text
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);

create policy "vehicle_images_delete_authenticated_tenant_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'vehicle-images'
  and (storage.foldername(name))[1] = (
    select p.dealership_id::text
    from public.profiles as p
    where p.id = (select auth.uid())
  )
);
