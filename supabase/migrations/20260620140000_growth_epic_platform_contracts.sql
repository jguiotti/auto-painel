/*
  migration: growth epic P2 — platform contract templates and contract instances
  purpose:
    - versioned SaaS contract templates (review before signature)
    - contract instances linked to prospects/dealerships with immutable snapshot after send
*/

create table public.platform_contract_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  version integer not null default 1,
  body_md text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint platform_contract_templates_slug_version_key unique (slug, version)
);

comment on table public.platform_contract_templates is
  'Versioned SaaS contract templates for platform sales (admin-master).';

create table public.platform_contracts (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.platform_contract_templates (id) on delete restrict,
  template_version integer not null,
  saas_prospect_id uuid references public.saas_prospects (id) on delete set null,
  dealership_id uuid references public.dealerships (id) on delete set null,
  counterparty_name text not null,
  counterparty_email text not null,
  plan_name text,
  monthly_amount numeric(14, 2),
  status text not null default 'draft',
  review_notes text,
  body_snapshot_md text not null,
  signature_provider_ref text,
  sent_for_signature_at timestamptz,
  signed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_contracts_status_check check (
    status in ('draft', 'sent_for_signature', 'signed', 'cancelled')
  ),
  constraint platform_contracts_counterparty_email_format check (
    counterparty_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

comment on table public.platform_contracts is
  'Commercial SaaS contract instances; body_snapshot is frozen when sent for signature.';

create index platform_contracts_status_idx
  on public.platform_contracts (status, created_at desc);

create index platform_contracts_saas_prospect_id_idx
  on public.platform_contracts (saas_prospect_id);

alter table public.platform_contract_templates enable row level security;
alter table public.platform_contracts enable row level security;

create policy "platform_contract_templates_select_super_admin"
on public.platform_contract_templates
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_contract_templates_insert_super_admin"
on public.platform_contract_templates
for insert
to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_contract_templates_update_super_admin"
on public.platform_contract_templates
for update
to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

create policy "platform_contracts_select_super_admin"
on public.platform_contracts
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_contracts_insert_super_admin"
on public.platform_contracts
for insert
to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_contracts_update_super_admin"
on public.platform_contracts
for update
to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

insert into public.platform_contract_templates (slug, name, version, body_md)
values (
  'saas-acquisition',
  'Contrato de licença SaaS AutoPainel',
  1,
  $body$# Contrato de licença de uso — AutoPainel

## 1. Objeto
Licença de uso não exclusiva da plataforma AutoPainel (vitrine, painel e módulos contratados).

## 2. Plano e módulos
Conforme **Anexo I** — plano, valor mensal e módulos habilitados.

## 3. Vigência
Contrato por prazo indeterminado com renovação automática mensal, salvo rescisão conforme cláusula 9.

## 4. Valores e pagamento
Valor mensal indicado no Anexo I, vencimento conforme fatura. Inadimplência superior a 15 dias pode suspender o acesso.

## 5. Obrigações da Contratada (AutoPainel)
Disponibilidade conforme SLA do plano; suporte nos canais contratados.

## 6. Obrigações da Contratante
Uso lícito; veracidade dos dados de estoque e leads; não compartilhar credenciais.

## 7. Proteção de dados (LGPD)
Contratante é controlador dos dados de seus clientes finais; AutoPainel atua como operador na prestação do serviço.

## 8. Propriedade intelectual
Software permanece da AutoPainel; dados inseridos pela loja pertencem à Contratante.

## 9. Rescisão
Qualquer parte pode rescindir com aviso de 30 dias. Exportação de dados disponível por 30 dias após encerramento.

## 10. Limitação de responsabilidade
Limitada ao valor pago nos últimos 12 meses, na forma permitida pela lei.

## 11. Foro
Comarca de Santos/SP.

---
**Anexo I** — Preencher antes do envio: razão social, CNPJ, plano, valor mensal (R$), módulos.
$body$
)
on conflict (slug, version) do nothing;
