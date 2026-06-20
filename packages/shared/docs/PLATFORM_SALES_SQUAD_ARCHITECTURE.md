# Arquitetura — Equipe comercial AutoPainel (Fase 4)

> **Status:** Contratos + migração SQL prontos. Aplicar manualmente no Supabase Dashboard ou via workflow CLI do time.  
> **PRD:** [`PRD_PLATFORM_SALES_SQUAD.md`](./PRD_PLATFORM_SALES_SQUAD.md) · **UX:** [`UX_PLATFORM_SALES_SQUAD.md`](./UX_PLATFORM_SALES_SQUAD.md)

---

## 1. Escopo de tenant

Este épico **não** usa `dealership_id` como tenant root. Dados são **escopo plataforma**:

| Papel | Acesso |
| --- | --- |
| `super_admin` | CRUD comercial completo |
| `platform_sales_reps.user_id` | Leitura própria (extrato, PIX, carteira) |
| Loja / `owner` | Sem acesso |

Isolamento: RLS com `is_platform_super_admin()` + `current_platform_sales_rep_id()`.

**Module gating:** fora de escopo v1 (feature interna admin).

---

## 2. TypeScript (`packages/shared/src/types`)

| Arquivo | Conteúdo |
| --- | --- |
| `platform-sales-squad.ts` | Enums, records, inputs |
| `supabase-rpc.ts` | Args das RPCs comerciais |

---

## 3. RPC / API surface

| RPC | Auth | Request | Response | Notas |
| --- | --- | --- | --- | --- |
| `transfer_sales_rep_portfolio` | super_admin | `TransferSalesRepPortfolioArgs` | `{ transfer_id, dealerships_moved }` | Repasse carteira |
| `confirm_dealership_sales_attribution` | super_admin | `p_attribution_id` | `uuid \| null` (ledger id) | Dispara 1ª linha pending |
| `clawback_dealership_sales_commissions` | super_admin | `p_dealership_id` | `integer` (rows) | Churn ≤ 30d |
| `approve_sales_commission_ledger_entries` | super_admin | `p_entry_ids[]` | `integer` | Aprovação financeiro |
| `current_platform_sales_rep_id` | authenticated | — | `uuid` | Helper invoker |
| `is_platform_sales_rep` | authenticated | — | `boolean` | Middleware portal |

**Fase 5 (backend):** CRUD via PostgREST direto nas tabelas + RPCs acima; jobs `generate_monthly_commission_ledger`, `generate_payout_batch`, `mark_payout_batch_paid` (ainda não migrados).

---

## 4. Migração

**Arquivo:** `supabase/migrations/20260620180100_platform_sales_squad.sql`

| Tabela | Propósito |
| --- | --- |
| `platform_sales_reps` | Cadastro representante |
| `platform_sales_rep_bank_accounts` | PIX/TED |
| `platform_sales_rep_dealership_attributions` | Vínculo loja ↔ rep |
| `platform_sales_rep_portfolio_transfers` | Audit repasse |
| `platform_commission_rules` | Regras versionadas |
| `platform_commission_ledger_entries` | Extrato |
| `platform_incentive_campaigns` | Campanhas |
| `platform_payout_batches` / `_items` | Lotes pagamento |

---

## 5. Integrações

| Evento | Ação |
| --- | --- |
| Contrato `signed` + loja criada | Criar attribution `pending` → `confirm_dealership_sales_attribution` |
| Lead B2B `won` | Drawer vínculo → insert attribution |
| `dealerships.status` → `churned` | Trigger/job → `clawback_dealership_sales_commissions` se ≤ 30d |
| Cron mensal (dia 1) | Job comissão recorrente (Fase 5) |
| Cron pagamento (dia 10) | Gerar lote (Fase 5) |

---

## 6. Execution prompts (Fase 5 Backend)

```
[Prompt 1] apps/admin-master actions: platform-sales-reps.ts — CRUD reps + bank via service role
[Prompt 2] apps/admin-master actions: platform-sales-attributions.ts — create + confirm RPC
[Prompt 3] apps/admin-master actions: platform-sales-portfolio.ts — transfer RPC wrapper
[Prompt 4] middleware /painel/comercial/* — is_platform_sales_rep gate
[Prompt 5] Edge/cron stub generate_monthly_commission_ledger (optional v1.1)
```

---

## 7. QA matrix (preview)

| Cenário | Esperado |
| --- | --- |
| Rep A vê extrato de Rep B | 403 / zero rows RLS |
| super_admin repassa carteira | attributions moved, audit row |
| Churn 30d | clawback negativo no extrato |
| Rep confirma attribution | ledger pending criado |

---

**Próximo:** Fase 5 Backend + Fase 6 Frontend (após aplicar migração no Supabase remoto).
