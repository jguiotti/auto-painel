/*
  migration: dealership operator billing contract window + installment documents
  purpose:
    - store commercial contract dates on dealership_billing (start/end)
    - attach receipts/invoices/contracts to billing history rows (jsonb manifest + Storage)
  affects: public.dealership_billing, public.dealership_billing_history, storage.buckets
*/

-- ---------------------------------------------------------------------------
-- billing agreement: contractual window (independent from subscription cycle timestamps)
-- ---------------------------------------------------------------------------

alter table public.dealership_billing
add column if not exists contract_started_on date;

alter table public.dealership_billing
add column if not exists contract_ends_on date;

comment on column public.dealership_billing.contract_started_on is
  'Inclusive start date of the active commercial SaaS agreement for this dealership.';

comment on column public.dealership_billing.contract_ends_on is
  'Inclusive end date of the SaaS agreement; null when open-ended until renewal notice.';

-- ---------------------------------------------------------------------------
-- history: immutable-ish manifest of uploaded operator documents (Storage paths)
-- ---------------------------------------------------------------------------

alter table public.dealership_billing_history
add column if not exists supporting_documents jsonb not null default '[]'::jsonb;

comment on column public.dealership_billing_history.supporting_documents is
  'JSONArray of attachment metadata {id, stored_path, original_name, doc_kind, uploaded_at}; files live in Storage bucket dealership-operator-billing.';

-- ---------------------------------------------------------------------------
-- private bucket — server-side service role uploads + signed URLs in admin-master
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('dealership-operator-billing', 'dealership-operator-billing', false)
on conflict (id) do nothing;
