# /squad — Workflow completo AutoPainel (8 fases)

Execute o workflow completo. Ordem obrigatória — não pule fases. Pause entre cada uma.

## Fase 1 — PM Agent
PRD: Feature Description · Affected Surfaces (tabela por app) · Business Rules (tenant isolation + roles) · Acceptance Scenarios (happy + negativos + cross-tenant) · Out of Scope · Open Questions.
Pause. Aguarde confirmação.

## Fase 2 — UX Writer Agent *(após PRD aprovado)*
Microcopy de todas as telas · empty states · erros · toasts · module-gated states. Todo texto pt-BR.
Pause. Aguarde confirmação.

## Fase 3 — UX Agent *(após copy aprovado)*
Personas & Goals · User Journey por persona · Screen & Component Inventory (estados: loading/empty/error/success/permission-denied/module-inactive) · Design system mapping (@autopainel/shared/ui) · Whitelabel · Responsive. Flag componentes novos para packages/shared.
Pause. Aguarde confirmação.

## Fase 4 — Arquiteto Supabase *(após UX aprovado)*
TypeScript Contracts (packages/shared/src/types) · RPC Surface (tenant-scoped) · Migrations SQL (RLS + tenant_id + soft-delete) · Module gating · Edge Functions · Execution Prompts.
NUNCA sugerir supabase db push sem o usuário pedir.
Pause. Aguarde confirmação.

## Fase 5 — Backend Agent *(após contratos definidos)*
Server actions · RPC calls tipadas · tenant isolation em cada query · module gate checks · AppError mapping · types de packages/shared.
Pause. Aguarde confirmação.

## Fase 6 — Frontend Agent *(após backend implementado)*
Telas Next.js · UI de @autopainel/shared/ui apenas · copy do UX Writer · tipos de packages/shared · todos os estados · 'use client' apenas onde necessário.
Pause. Aguarde confirmação.

## Fase 7 — DevOps *(antes de produção)*
Env vars Vercel · Secrets Supabase · Migration checklist prod · .env.example atualizado · documentacao-tecnica.md.
Pause. Aguarde confirmação.

## Fase 8 — QA Agent *(antes de declarar done)*
E2E scenarios · Tenant Isolation Matrix (obrigatório) · Permission Matrix · Security Checklist · Multi-App Regression · UX Copy Verification · Findings.
Sprint Review + atualizar regras-de-negocio.md e documentacao-tecnica.md.

---
**Funcionalidade:** $[FEATURE_DESCRIPTION]

---

## Épico integradores classificados (OLX · WebMotors)

Use este roteiro quando a feature envolver `classifieds_sync`, publish/delist ou novo portal.

**Blueprint:** `packages/shared/docs/CLASSIFIEDS_INTEGRATORS_BLUEPRINT.md`

### Checklist por fase

| Fase | Foco integradores |
| --- | --- |
| **PM** | Módulos **por portal** (`olx_sync`, `webmotors_sync`); plano escolhe subset; bundle `classifieds_sync` legado; auto-publish só portais contratados+conectados; Meta fora |
| **UX Writer** | Copy «Conectar» por portal; toasts enqueue; estados fila (pendente/publicado/erro); opt-out «Não divulgar em classificados» |
| **UX** | Hub mostra **só** cards do plano; ficha com linhas por portal habilitado; formulário sem checkboxes obrigatórios se auto-publish |
| **Arquiteto** | Migração split `saas_modules`; `isClassifiedsProviderModuleEnabled`; RPC enqueue valida módulo |
| **Backend** | `createVehicleAction`/`updateVehicleAction` enqueue; `deleteVehicleAction` delist first; refresh token |
| **Frontend** | Remover/simplificar `vehicle-promotion-section` checkboxes OLX/WM |
| **DevOps** | `OLX_*` / `WEBMOTORS_*` secrets; homologação APIs; cron workers |
| **QA** | Dry-run E2E publish+delist; manual credenciais reais; cross-tenant |

### Definition of Done (integradores)

- [ ] Plano pode incluir só OLX, só WM ou ambos — cards Integrações reflectem o plano.
- [ ] Novo veículo com foto → vitrine + fila publish **só** nos portais contratados e conectados.
- [ ] Vendido/inativo/excluído → delist enfileirado em todos conectados.
- [ ] Ficha mostra URL externa quando publicado.
- [ ] `regras-de-negocio.md` + `documentacao-tecnica.md` + blueprint atualizados.

**Não implementar Meta neste épico** — registrar bloqueio explícito no PRD se surgir escopo cruzado.
