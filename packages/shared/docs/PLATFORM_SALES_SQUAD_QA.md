# QA — Equipe comercial AutoPainel (Fase 8)

> **Status:** Matriz entregue · automação parcial (Playwright + script RLS local)  
> **PRD:** [`PRD_PLATFORM_SALES_SQUAD.md`](./PRD_PLATFORM_SALES_SQUAD.md) · **Arquitetura:** [`PLATFORM_SALES_SQUAD_ARCHITECTURE.md`](./PLATFORM_SALES_SQUAD_ARCHITECTURE.md)

---

## 1. Escopo QA v1

| Incluído | Fora do v1 (deferido) |
| --- | --- |
| RLS rep ↔ rep, rep ↔ admin | Cron comissão mensal recorrente (BZ-SQ-02 job) |
| Portal rep (login, rotas, redirect) | Lotes pagamento dia 10 + export CSV |
| Admin CRUD lista/form/extrato/repasse | Campanhas incentivo (UI `/campanhas`) |
| RPCs: confirm, transfer, clawback, approve | Drawer vínculo em leads/contratos |
| Hook churn em `updateDealershipAction` | Criptografia PIX em repouso |
| Playwright smoke + script RLS local | Meta (bloqueado externamente) |

---

## 2. Pré-requisitos (local)

```bash
npm run supabase:start          # ou stack remota de dev
npm run seed:admin-user         # operador@autopainel.demo
npm run seed:platform-sales-rep-qa   # rep.a / rep.b
npm run dev:admin-master        # porta 3001
```

| Conta | E-mail | Senha |
| --- | --- | --- |
| Operador plataforma | `operador@autopainel.demo` | `AdminAuto2026!` |
| Rep QA A | `rep.a@autopainel.demo` | `RepDemo123!` |
| Rep QA B | `rep.b@autopainel.demo` | `RepDemo123!` |

---

## 3. Automação

| Comando | O que valida |
| --- | --- |
| `npm run qa:platform-sales-squad-rls` | RLS PostgREST: isolamento extrato, rep não insere rep, RPC transfer bloqueada |
| `npm run test:e2e -- e2e/specs/platform-sales-squad.spec.ts` | Auth gates, admin UI smoke, portal rep, bloqueio gestor loja |

Variáveis E2E opcionais: `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_SALES_REP_A_EMAIL`, `E2E_SALES_REP_B_EMAIL`, `E2E_SALES_REP_PASSWORD`, `E2E_STRICT_ADMIN_AUTH`, `E2E_STRICT_SALES_REP_AUTH`.

---

## 4. Matriz de permissões (escopo plataforma — não tenant loja)

Este épico **não** usa `dealership_id` como root. Isolamento crítico: **rep A ≠ rep B**; **lojista ≠ admin/rep**.

| Ator | Recurso | SELECT | INSERT | UPDATE | RPC admin |
| --- | --- | --- | --- | --- | --- |
| `super_admin` | `platform_sales_reps` | ✅ todos | ✅ | ✅ | ✅ transfer, confirm, clawback, approve |
| `sales_rep` (ativo) | próprio extrato / PIX / carteira | ✅ próprio | PIX próprio | PIX próprio | ❌ forbidden |
| `sales_rep` | extrato de outro rep | ❌ 0 rows | — | — | — |
| `owner`/`manager` loja | tabelas comerciais | ❌ login admin negado | ❌ | ❌ | ❌ |
| `anon` | `/painel/*` | — | — | — | redirect `/login` |

---

## 5. Cenários E2E (critérios de aceite PRD §10)

### CA-SQ-01 — Cadastrar rep com PIX

```
Test: Admin cadastra representante e PIX
  Given: super_admin logado
  When:  preenche /painel/equipe/comercial/novo e salva; cadastra PIX na ficha
  Then:  rep aparece na lista; toast sucesso; conta bancária persistida
  Status: [ ] manual | [x] parcial (UI + actions; E2E smoke lista/novo)
```

### CA-SQ-02 — Fechar loja → ledger pending

```
Test: Vínculo comercial confirmado gera comissão pending
  Given: rep ativo + concessionária existente
  When:  admin vincula loja com primeira fatura R$ 397 e confirma
  Then:  attribution confirmed; ledger pending com valor > 0 (10% default × share)
  Status: [ ] manual (validar RPC confirm_dealership_sales_attribution)
```

### CA-SQ-03 — Aprovar ledger → lote dia 10

```
Test: Aprovação financeira
  Given: linha pending no extrato
  When:  admin seleciona e aprova
  Then:  status approved; elegível para lote (job v1.1)
  Status: [ ] manual UI | [ ] job lote — **deferido v1.1**
```

### CA-SQ-04 — Export CSV lote

```
Status: [ ] **deferido v1.1** (sem UI pagamentos)
```

### CA-SQ-05 — Campanha bônus 3 setups

```
Status: [ ] **deferido v1.1** (sem job campanha)
```

### CA-SQ-06 — Repasse carteira A → B

```
Test: Repasse move attributions confirmadas
  Given: rep A com lojas confirmadas; rep B ativo
  When:  wizard repasse em /painel/equipe/comercial/[id]/repasse
  Then:  attributions sales_rep_id = B; audit em platform_sales_rep_portfolio_transfers
  Status: [ ] manual
```

### CA-SQ-07 — Rep vê Meu extrato

```
Test: Portal rep extrato próprio
  Given: rep.a logado (seed QA)
  When:  abre /painel/comercial/extrato
  Then:  vê cards resumo + lançamentos seed "QA seed — alpha"; zero linhas de rep B
  Status: [x] Playwright login + heading | [x] script RLS
```

### CA-SQ-08 — Isolamento Rep A / Rep B

```
Test: Rep A não vê extrato de Rep B
  Given: seed QA com ledger A e B
  When:  rep.a consulta platform_commission_ledger_entries via JWT
  Then:  apenas sales_rep_id = rep A
  Status: [x] npm run qa:platform-sales-squad-rls
```

### CA-SQ-09 — Churn 30 dias → estorno

```
Test: Clawback automático ao encerrar loja
  Given: loja com attribution confirmed + ledger paid/pending < 30d desde closed_at
  When:  admin altera status concessionária para churned
  Then:  linhas clawback negativas; attributions cancelled
  Status: [ ] manual SQL (ver §7)
```

### CA-SQ-10 — Rep bloqueado no admin

```
Test: Rep redirecionado fora do painel admin
  Given: rep.a logado
  When:  navega para /painel/dashboard
  Then:  redirect /painel/comercial/extrato
  Status: [x] Playwright
```

### CA-SQ-11 — Gestor loja bloqueado no admin-master

```
Test: Tenant user não entra no admin
  Given: gestor.guiotti@autopainel.demo
  When:  tenta login admin-master
  Then:  permanece em /login com mensagem de permissão
  Status: [x] Playwright
```

---

## 6. Regras de negócio (BZ) × evidência

| ID | Regra | Evidência QA |
| --- | --- | --- |
| BZ-SQ-01 | Comissão após vínculo **confirmed** | RPC + UI confirmar; pending só após confirm |
| BZ-SQ-02 | Comissão recorrente mensal | **Gap v1.1** — job não migrado |
| BZ-SQ-03 | Estorno total churn ≤ 30d | RPC `clawback_*` + hook `updateDealershipAction` — teste manual §7 |
| BZ-SQ-04 | Repasse carteira | RPC + wizard UI — teste manual |
| BZ-SQ-05 | Split ≤ 100% | CHECK `attribution_share_bps`; validação form |
| BZ-SQ-06 | Rep ≠ super_admin ≠ vendedor loja | Cadastros separados; Playwright gestor bloqueado |
| BZ-SQ-07 / BZ-SQ-08 | Rep vê/edita próprio extrato e PIX | RLS script + portal UI |

---

## 7. Procedimentos manuais (SQL / Dashboard)

### 7.1 Clawback churn (BZ-SQ-03)

1. Criar vínculo confirmed com `closed_at = now()` para loja de teste.
2. Confirmar ledger pending e marcar approved (UI extrato admin).
3. Em **Concessionárias**, alterar status para **Encerrada** (`churned`).
4. Verificar:

```sql
select entry_type, amount_cents, status, description
from public.platform_commission_ledger_entries
where attribution_id in (
  select id from public.platform_sales_rep_dealership_attributions
  where dealership_id = '<DEALERSHIP_UUID>'
)
order by created_at desc;
```

Esperado: linha `clawback` negativa + attributions `cancelled`.

### 7.2 Repasse carteira (BZ-SQ-04)

Após wizard, conferir:

```sql
select * from public.platform_sales_rep_portfolio_transfers
order by created_at desc limit 1;

select sales_rep_id, dealership_id, status
from public.platform_sales_rep_dealership_attributions
where dealership_id = any(array['<UUID>']::uuid[]);
```

---

## 8. Security checklist

- [x] RLS enabled em todas as tabelas `platform_sales_*` e ledger/payout
- [x] Rep isolado via `current_platform_sales_rep_id()` em policies SELECT
- [x] RPCs admin checam `is_platform_super_admin()` (forbidden para rep)
- [x] Rotas `/painel/comercial/*` gate rep-only; demais `/painel` rep → redirect extrato
- [x] Gestor loja não autentica no admin-master
- [ ] PIX/chave em repouso cifrada — **gap** (mascaramento UI apenas v1)
- [ ] Role `finance_admin` separado — **futuro**
- [x] Service role data layer admin não exposto ao browser (server-only fetchers)

---

## 9. UX copy (amostragem)

- [x] Lista rep: "Representantes comerciais", empty "Nenhum representante cadastrado"
- [x] Portal: "Meu extrato", banner PIX, "Dados de pagamento"
- [x] Erros login rep/admin em pt-BR sem stack trace
- [ ] Campanhas/pagamentos — N/A v1

---

## 10. Findings & follow-ups

| # | Severidade | Descrição | Owner | Status |
| --- | --- | --- | --- | --- |
| F-01 | 🟡 minor | Job comissão recorrente mensal (BZ-SQ-02) ausente | Backend/DevOps | v1.1 |
| F-02 | 🟡 minor | UI lotes pagamento + export CSV (CA-03/04) ausente | Frontend | v1.1 |
| F-03 | 🟡 minor | Campanhas incentivo sem UI (CA-05) | Frontend | v1.1 |
| F-04 | 🟡 minor | Drawer vínculo leads/contratos não integrado | Frontend | backlog |
| F-05 | 🟡 minor | PIX armazenado em claro no DB; só mascarado na UI | Security | backlog |
| F-06 | 🟢 info | Admin `super_admin` vê AdminShell ao visitar `/painel/comercial/*` (aceitável v1) | — | accepted |
| F-07 | 🟢 info | Rep inativo (`status != active`) perde login portal — by design | — | accepted |

---

## 11. Sprint review (Fase 8)

**QA concluído (v1):** RLS rep isolado automatizado; smoke Playwright auth/UI/portal; matriz BZ/CA documentada; gaps v1.1 registrados.

**Riscos:** comissão recorrente sem cron — operação manual até v1.1; churn clawback depende de operador marcar `churned` (hook OK, validar manualmente uma vez por release).

**Follow-ups:** implementar jobs + pagamentos; integrar drawer leads; rodar §7.1 em staging antes de go-live comercial.

---

**Histórico:** jun/2026 — Fase 8 QA inicial.
