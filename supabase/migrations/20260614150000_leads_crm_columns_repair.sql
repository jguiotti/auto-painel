/*
  migration: repair missing CRM columns on public.leads (phase A/B drift)
  purpose: idempotent add of columns expected by vitrine + painel contatos
  affected: public.leads
*/

-- phase A — contact / consent
alter table public.leads
  alter column vehicle_id drop not null;

alter table public.leads
  add column if not exists source text not null default 'vehicle_page';

alter table public.leads
  add column if not exists client_email text;

alter table public.leads
  add column if not exists message text;

alter table public.leads
  add column if not exists privacy_policy_accepted_at timestamptz;

alter table public.leads
  add column if not exists privacy_policy_version text;

alter table public.leads
  add column if not exists marketing_consent boolean not null default false;

alter table public.leads
  add column if not exists marketing_consent_at timestamptz;

-- phase B — pipeline
alter table public.leads
  add column if not exists status text not null default 'new';

alter table public.leads
  add column if not exists next_follow_up_at timestamptz;

alter table public.leads
  add column if not exists converted_vehicle_id uuid references public.vehicles (id) on delete set null;

alter table public.leads
  add column if not exists created_by uuid references auth.users (id) on delete set null;

alter table public.leads
  drop constraint if exists leads_status_check;

alter table public.leads
  add constraint leads_status_check check (
    status in ('new', 'contacted', 'hot', 'won', 'lost')
  );

alter table public.leads
  drop constraint if exists leads_source_check;

alter table public.leads
  add constraint leads_source_check check (
    source in (
      'vehicle_page',
      'finance_simulator',
      'contact_page',
      'whatsapp_float',
      'manual'
    )
  );

comment on column public.leads.client_email is
  'Optional e-mail from vitrine contact forms.';

create index if not exists leads_dealership_status_idx
  on public.leads (dealership_id, status);

create index if not exists leads_next_follow_up_at_idx
  on public.leads (dealership_id, next_follow_up_at)
  where next_follow_up_at is not null;

notify pgrst, 'reload schema';
