/*
  migration: marketing-site LGPD consent fields on saas_prospects
  purpose: persist privacy policy acceptance and optional marketing opt-in from contact forms
  affected: public.saas_prospects, insert RLS policies
*/

alter table public.saas_prospects
  add column if not exists privacy_policy_accepted_at timestamptz,
  add column if not exists privacy_policy_version text,
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists marketing_consent_at timestamptz;

comment on column public.saas_prospects.privacy_policy_accepted_at is
  'Timestamp when the prospect accepted the privacy policy (required for marketing_site inserts).';

comment on column public.saas_prospects.privacy_policy_version is
  'Version slug of the privacy policy accepted (e.g. 2026-06-12).';

comment on column public.saas_prospects.marketing_consent is
  'Whether the prospect opted in to commercial contact (email/WhatsApp).';

comment on column public.saas_prospects.marketing_consent_at is
  'Timestamp of marketing opt-in when marketing_consent is true.';

-- tighten insert policies: privacy acceptance required
drop policy if exists "saas_prospects_insert_anon_marketing" on public.saas_prospects;
drop policy if exists "saas_prospects_insert_authenticated_marketing" on public.saas_prospects;

create policy "saas_prospects_insert_anon_marketing"
on public.saas_prospects
for insert
to anon
with check (
  length(trim(full_name)) >= 2
  and length(trim(email)) >= 3
  and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  and metadata is not null
  and trim(source) in ('marketing_site')
  and privacy_policy_accepted_at is not null
  and length(trim(coalesce(privacy_policy_version, ''))) >= 1
  and (phone is null or length(trim(phone)) <= 40)
  and (company_name is null or length(trim(company_name)) <= 200)
  and (message is null or length(message) <= 10000)
  and (
    marketing_consent = false
    or marketing_consent_at is not null
  )
);

create policy "saas_prospects_insert_authenticated_marketing"
on public.saas_prospects
for insert
to authenticated
with check (
  length(trim(full_name)) >= 2
  and length(trim(email)) >= 3
  and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  and metadata is not null
  and trim(source) in ('marketing_site')
  and privacy_policy_accepted_at is not null
  and length(trim(coalesce(privacy_policy_version, ''))) >= 1
  and (phone is null or length(trim(phone)) <= 40)
  and (company_name is null or length(trim(company_name)) <= 200)
  and (message is null or length(message) <= 10000)
  and (
    marketing_consent = false
    or marketing_consent_at is not null
  )
);
