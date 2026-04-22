/*
  migration: tighten saas_prospects insert RLS (replace with check (true))
  purpose: satisfy security advisors; same rules as table constraints + source allowlist + field length caps
  note: safe to run if policies already use explicit checks (idempotent replace)
*/

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
  and (phone is null or length(trim(phone)) <= 40)
  and (company_name is null or length(trim(company_name)) <= 200)
  and (message is null or length(message) <= 10000)
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
  and (phone is null or length(trim(phone)) <= 40)
  and (company_name is null or length(trim(company_name)) <= 200)
  and (message is null or length(message) <= 10000)
);
