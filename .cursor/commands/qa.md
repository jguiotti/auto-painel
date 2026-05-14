# /qa — Revisão de QA (QA Phase)

Ative o **QA Agent** para a funcionalidade implementada no contexto atual.

Produza:
1. E2E Scenarios (Given/When/Then) — happy paths + negativos + permissões + empty states
2. Permission / RLS Matrix (role × ação × resultado esperado)
3. Security Checklist Supabase (RLS, tenant isolation, JWT, soft-delete)
4. Regression Risks (componentes/types/migrations tocados que podem impactar outras features)
5. Findings & Follow-ups (tabela: severidade | descrição | owner | status)

Ao final, fazer Sprint Review: o que foi entregue, riscos, follow-ups.

Lembrar: atualizar `regras-de-negocio.md` e `documentacao-tecnica.md` na mesma entrega (per `internal-docs-living.mdc`).