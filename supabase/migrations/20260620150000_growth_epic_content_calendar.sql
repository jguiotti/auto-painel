/*
  migration: growth epic P3 — marketing content calendar for operators
*/

create table public.platform_content_calendar_items (
  id uuid primary key default gen_random_uuid(),
  scheduled_for date not null,
  channel text not null,
  title text not null,
  objective text,
  status text not null default 'draft',
  body_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_content_calendar_channel_check check (
    channel in ('instagram', 'linkedin', 'blog', 'email', 'whatsapp', 'other')
  ),
  constraint platform_content_calendar_status_check check (
    status in ('draft', 'scheduled', 'published', 'cancelled')
  )
);

comment on table public.platform_content_calendar_items is
  'Editorial calendar for AutoPainel marketing (admin-master).';

create index platform_content_calendar_scheduled_idx
  on public.platform_content_calendar_items (scheduled_for asc, status);

alter table public.platform_content_calendar_items enable row level security;

create policy "platform_content_calendar_select_super_admin"
on public.platform_content_calendar_items
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_content_calendar_insert_super_admin"
on public.platform_content_calendar_items
for insert
to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_content_calendar_update_super_admin"
on public.platform_content_calendar_items
for update
to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "platform_content_calendar_delete_super_admin"
on public.platform_content_calendar_items
for delete
to authenticated
using ((select public.is_platform_super_admin()));

insert into public.platform_content_calendar_items (scheduled_for, channel, title, objective, status, body_notes)
values
  (current_date + 3, 'instagram', 'Antes e depois: vitrine sem agência', 'awareness', 'scheduled', 'Carrossel 5 slides — dor agência vs painel próprio'),
  (current_date + 7, 'linkedin', 'Case: loja que centralizou leads', 'consideration', 'draft', 'Post longo + CTA demo'),
  (current_date + 10, 'blog', 'Quanto custa site de concessionária em 2026', 'seo', 'draft', 'Keyword cluster compra — link /planos'),
  (current_date + 14, 'whatsapp', 'Campanha indicação lojista', 'conversion', 'draft', 'Script curto + link contato');
