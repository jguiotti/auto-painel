# /squad — Workflow completo de squad (todas as fases)

Execute o workflow completo de squad para a funcionalidade descrita. Siga a ordem obrigatória e **não pule nem reordene fases**.

## Fase 1 — PM Agent
Produza o PRD completo (Feature Description, Problem Statement, Business Rules, Acceptance Scenarios, Out of Scope, Open Questions).

Pause aqui e aguarde confirmação antes de continuar.

---

## Fase 2 — UX Agent *(após PRD aprovado)*
Produza: Personas & Goals, User Journey, Screen & Component Inventory, Whitelabel & Responsive Notes, Edge Cases.

Pause aqui e aguarde confirmação.

---

## Fase 3 — Architect + Backend Agent *(após UX aprovado)*
Produza: TypeScript Contracts, API/RPC Surface, Database Changes, Edge Functions, Execution Prompts.

Pause aqui e aguarde confirmação. **Não inicie frontend antes desta fase estar completa.**

---

## Fase 4 — Frontend Agent *(após contratos definidos)*
Implemente screens e componentes consumindo os tipos de `packages/shared`. Todos os estados tratados. Sem redefinição de types.

Pause aqui e aguarde confirmação.

---

## Fase 5 — QA Agent *(antes de declarar done)*
E2E scenarios, Permission Matrix, Security Checklist Supabase, Regression Risks, Findings.

---

## Fase 6 — Sprint Review
Resumo do que foi entregue, riscos identificados, follow-ups para próxima sprint.

Lembrar: atualizar docs internos (`regras-de-negocio.md`, `documentacao-tecnica.md`) na mesma entrega.

---

**Funcionalidade:** $[FEATURE_DESCRIPTION]
