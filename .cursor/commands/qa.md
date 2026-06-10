# /qa — Revisão de QA (QA Phase)

Ative o QA Agent para a feature implementada.

Produza:
1. E2E Scenarios (Given/When/Then) — happy + negativos + cross-tenant + module-gated + empty states
2. Tenant Isolation Matrix (obrigatório se feature toca dados de tenant): operator A vs B × SELECT/INSERT/UPDATE
3. Permission/Role Matrix (role × ação × resultado)
4. Security Checklist Supabase (RLS, tenant_id, JWT, soft-delete, module gate)
5. Multi-App Regression (packages/shared tocado? quais apps afetados?)
6. UX Copy Verification (copy bate com UX Writer? sem textos ad-hoc nos componentes?)
7. Findings & Follow-ups (severidade | descrição | owner | status)

Sprint Review ao finalizar.
Atualizar regras-de-negocio.md e documentacao-tecnica.md (internal-docs-living.mdc).
