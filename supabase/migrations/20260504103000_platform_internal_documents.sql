/*
  migration: internal markdown docs for AutoPainel operators (admin-master), stored in Postgres with strict RLS
  affected: public.platform_internal_documents, helper function public.is_platform_super_admin(), grants
*/

-- ---------------------------------------------------------------------------
-- helper: caller must be authenticated super_admin with no dealership (platform ops)
-- ---------------------------------------------------------------------------

create or replace function public.is_platform_super_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
      and p.dealership_id is null
  );
$$;

comment on function public.is_platform_super_admin() is
  'True when the current auth user is a platform operator (super_admin, dealership_id null).';

grant execute on function public.is_platform_super_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- table: one row per internal doc slug
-- ---------------------------------------------------------------------------

create table public.platform_internal_documents (
  doc_slug text not null,
  body_md text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users (id) on delete set null,
  constraint platform_internal_documents_pkey primary key (doc_slug),
  constraint platform_internal_documents_doc_slug_check check (
    doc_slug in ('business_rules', 'technical')
  )
);

comment on table public.platform_internal_documents is
  'Internal markdown for AutoPainel operators only; dealership tenants must never receive this via PostgREST from their sessions.';

comment on column public.platform_internal_documents.doc_slug is
  'business_rules: PRD / BZ. technical: architecture & API notes.';

comment on column public.platform_internal_documents.body_md is
  'Markdown body rendered in admin-master internal documentation pages.';

comment on column public.platform_internal_documents.updated_by is
  'Last editor auth user id; nullable if migrated without actor.';

alter table public.platform_internal_documents enable row level security;

-- Platform operators only (select / insert / update). No delete policy — deletes denied.

create policy "platform_internal_documents_select_platform_super_admin"
on public.platform_internal_documents
for select
to authenticated
using ((select public.is_platform_super_admin()));

create policy "platform_internal_documents_insert_platform_super_admin"
on public.platform_internal_documents
for insert
to authenticated
with check ((select public.is_platform_super_admin()));

create policy "platform_internal_documents_update_platform_super_admin"
on public.platform_internal_documents
for update
to authenticated
using ((select public.is_platform_super_admin()))
with check ((select public.is_platform_super_admin()));

grant select, insert, update on table public.platform_internal_documents to authenticated;

-- ---------------------------------------------------------------------------
-- seed (idempotent when rows already exist)
-- ---------------------------------------------------------------------------

insert into public.platform_internal_documents (doc_slug, body_md)
values
  (
    'business_rules',
    $bz$# Regras de negócio (uso interno)

Esta página é **somente para a equipe AutoPainel**. Clientes das concessionárias **não** veem este conteúdo.

## Como manter atualizado

1. Para cada nova funcionalidade, o **PM** registra aqui o PRD em formato vivo: problema, escopo, regras de negócio numeradas e cenários de aceite.
2. Prefira **salvar pelo painel Admin** (botão «Salvar alterações»). O conteúdo fica na base Supabase com acesso restrito a operadores da plataforma (`super_admin`).
3. Se a tabela ainda não existir no ambiente, o painel pode exibir o arquivo de fallback em `apps/admin-master/content/internal-docs/regras-de-negocio.md`.

## Template sugerido

### Funcionalidade

- **Nome:**
- **Status:** rascunho | em desenvolvimento | em produção

### Problema

Descreva o problema da pessoa usuária ou da operação.

### Regras de negócio (BZ)

1. BZ-001 — …
2. BZ-002 — …

### Cenários de aceite

- **CA-001:** …
- **CA-002:** …

---

_Substitua esta seção pelo histórico vivo das decisões de produto._
$bz$
  ),
  (
    'technical',
    $tz$# Documentação técnica interna

Esta página é **somente para a equipe AutoPainel**. Use para registrar decisões de arquitetura, contratos de API, migrações relevantes e links para artefatos no repositório.

## Como manter atualizado

1. Após o refinamento (**Architect + Backend**), registre aqui os contratos principais (RPCs, tabelas novas, políticas RLS em alto nível, Edge Functions).
2. Referencie sempre os tipos compartilhados em `packages/shared` e documentação cross-cutting em `packages/shared/docs/` quando aplicável.
3. Prefira **salvar pelo painel Admin** (botão «Salvar alterações»).
4. Fallback versionado em `apps/admin-master/content/internal-docs/documentacao-tecnica.md` quando o ambiente ainda não tem a migração aplicada.

## Template sugerido

### Funcionalidade

- **Nome:**
- **Branch / PR:**

### Superfícies e contratos

- **RPC / REST / Edge:** …
- **Tipos (`packages/shared`):** …

### Dados e segurança

- **Tabelas / migrações:** …
- **RLS (resumo):** …

### Referências

- …

---

_Substitua esta seção pelo registro técnico vivo._
$tz$
  )
on conflict (doc_slug) do nothing;
