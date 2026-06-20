# UX — Equipe comercial AutoPainel (Fase 3)

> **Status:** Entregue para revisão. Handoff → Fase 4 Arquiteto Supabase.  
> **PRD:** [`PRD_PLATFORM_SALES_SQUAD.md`](./PRD_PLATFORM_SALES_SQUAD.md)  
> **Copy:** [`UX_COPY_PLATFORM_SALES_SQUAD.md`](./UX_COPY_PLATFORM_SALES_SQUAD.md)  
> **App:** `admin-master` (+ layout mínimo rep em `/painel/comercial/*`)

---

## 1. Apps e personas

| App | Persona | Objetivo neste épico |
| --- | --- | --- |
| `admin-master` | Diretor comercial / operador `super_admin` | Cadastrar reps, vincular lojas, repassar carteira, campanhas, aprovar extratos |
| `admin-master` | Financeiro AutoPainel | Gerar lotes, exportar CSV/PIX, marcar pago |
| `admin-master` | Representante comercial (login dedicado) | Ver **Meu extrato**, cadastrar PIX, acompanhar competências |
| `dealership-panel` | — | Fora de escopo |
| `customer-site` / marketing | — | Fora de escopo |

**Nota de navegação:** Operadores técnicos (`super_admin` sem vínculo comercial) permanecem em **Equipe AutoPainel → Operadores da plataforma** (já implementado). Este épico adiciona abas/rotas **Comercial** no mesmo hub.

---

## 2. Arquitetura de informação (admin)

```
/painel/equipe                          Hub com tabs
├── ?tab=operadores                     Operadores plataforma (existente)
├── /comercial                          Lista representantes
├── /comercial/novo                     Wizard cadastro
├── /comercial/[repId]                  Ficha rep (tabs: Dados · Bancário · Carteira)
├── /comercial/[repId]/extrato          Extrato admin
├── /comercial/[repId]/repasse         Wizard repasse carteira
├── /campanhas                          CRUD campanhas incentivo
├── /campanhas/nova
├── /campanhas/[id]
└── /pagamentos                         Lotes de pagamento

/painel/comercial                       Shell reduzido (rep — sem menu admin completo)
├── /extrato                            Meu extrato (v1)
└── /dados-pagamento                    Meu PIX/TED
```

**Menu lateral (admin-shell):** item **Equipe comercial** aponta para `/painel/equipe/comercial`. Sub-itens opcionais no command palette: Campanhas, Pagamentos.

**Integrações de entrada (vínculo loja):**

| Origem | Ação | Destino UX |
| --- | --- | --- |
| `/painel/leads-comerciais` | Lead → Fechado | Drawer «Vincular loja ao representante» |
| `/painel/contratos` | Contrato assinado | Mesmo drawer (pré-preenche loja) |
| `/painel/concessionarias/[id]/editar` | Secção comercial | Lista vínculos + «Adicionar representante» |

---

## 3. Jornadas por persona

### 3.1 Diretor comercial — cadastrar rep e vincular loja

```
1. Acessa /painel/equipe/comercial → tabela (loading skeleton → lista ou empty)
2. Clica «Novo representante» → /comercial/novo (form 2 colunas desktop)
3. Preenche dados + comissão % → «Salvar representante» → toast sucesso → redirect ficha /comercial/[id]
4. Aba «Dados bancários» → cadastra PIX → toast
5. Aba «Carteira» vazia → CTA «Vincular loja» OU veio do lead:
   - Em leads-comerciais, status Fechado → drawer vínculo
6. Drawer: loja, rep (pré), papel SDR/closer, % participação → Confirmar
7. Sistema gera attribution confirmed + ledger pending (mês corrente) → toast «Loja vinculada»
8. Menu ⋮ na linha do rep → «Ver extrato» → tabela lançamentos pending
```

### 3.2 Diretor — repasse de carteira (rep saiu)

```
1. /comercial/[id] → rep status Ativo com N lojas na carteira
2. Ação «Repassar carteira» → /comercial/[id]/repasse (wizard 3 passos)
   Step 1: Rep origem (fixo) · Rep destino (select reps ativos)
   Step 2: Data início repasse · Lojas (todas | checkboxes)
   Step 3: Resumo + checkbox confirmação
3. Confirmar → toast «Carteira repassada» → carteira origem reduzida, destino incrementada
4. Opcional: inativar rep origem (modal bloqueia se ainda tiver lojas sem repasse)
```

### 3.3 Financeiro — fechar competência e pagar

```
1. /painel/equipe/pagamentos → lista lotes (empty se nunca gerou)
2. Após aprovar lançamentos no extrato: «Gerar lote» → modal competência (mês anterior default)
3. Preview totais por rep → Confirmar → lote draft criado
4. «Exportar CSV» → download (PIX mascarado na preview, completo no export autenticado)
5. Após PIX manual: «Marcar como pago» → AlertDialog → lote paid, ledger entries paid
```

### 3.4 Representante — meu extrato (v1)

```
1. Login e-mail/senha (auth vinculado a sales_rep.user_id) → redirect /painel/comercial/extrato
2. Layout: header AutoPainel + nav mínimo (Extrato · Dados pagamento · Sair)
3. Cards resumo: A receber · Próximo pagamento · Pago no mês
4. Tabela filtrável por competência — só próprios lançamentos
5. Se PIX ausente: banner «Cadastre sua chave PIX» → /dados-pagamento
6. Mobile: cards empilhados, tabela vira lista de cards
```

### 3.5 Churn 30 dias (automático — feedback admin)

```
1. Loja cancelada < 30d após closed_at → job cria clawback no extrato do(s) rep(s)
2. Admin vê banner na ficha concessionária + linha estorno no extrato rep
3. Rep vê linha «Estorno — {loja} cancelou em X dias» no Meu extrato
```

---

## 4. Inventário de telas e componentes

Legenda estados: **L** loading · **E** empty · **S** success · **Er** error · **P** permission-denied

| # | Componente / tela | Rota | Estados | Interações | Permissão | Reuso |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `EquipeHubTabs` | `/painel/equipe/*` | L,S | Tabs: Operadores · Comercial · Campanhas · Pagamentos | `super_admin` | **Novo** em shared — wrapper `Tabs` |
| 2 | `SalesRepsListPage` | `/comercial` | L,E,S,Er | Busca, filtro status, sort, paginação | admin | `Table`, `Input`, `Select`, `Badge`, `EmptyState`, `DropdownMenu` |
| 3 | `SalesRepFormPage` | `/comercial/novo`, `/[id]` (edit) | L,S,Er | Form sections, save/cancel | admin | `Card`, `Input`, `Label`, `Select`, `Textarea`, `Button` |
| 4 | `SalesRepDetailLayout` | `/comercial/[id]` | L,S,Er | Tabs: Dados · Bancário · Carteira | admin | `Tabs`, `PageContainer` |
| 5 | `SalesRepBankForm` | aba Bancário | S,Er | PIX/TED toggle, masked preview | admin | `RadioGroup`, `Input`, `Select` |
| 6 | `SalesRepPortfolioTable` | aba Carteira | L,E,S | Lista lojas, split %, status vínculo | admin | `Table`, `Badge`, link concessionária |
| 7 | `DealershipAttributionDrawer` | drawer global | S,Er | Form split, validação 100% | admin | **Novo** — `Sheet` + form |
| 8 | `PortfolioTransferWizard` | `/comercial/[id]/repasse` | L,S,Er | 3 steps, checkbox confirmação | admin | **Novo** — `Stepper` pattern (shared) |
| 9 | `SalesRepLedgerPage` | `/comercial/[id]/extrato` | L,E,S,Er | Filtro competência/tipo, bulk approve, export | admin | `Table`, `Checkbox`, `DatePicker` |
| 10 | `IncentiveCampaignsList` | `/campanhas` | L,E,S | CRUD links, status badges | admin | `Table`, `Badge` |
| 11 | `IncentiveCampaignForm` | `/campanhas/nova`, `/[id]` | S,Er | Métrica meta, período, elegíveis | admin | `Form`, `Calendar` |
| 12 | `PayoutBatchesList` | `/pagamentos` | L,E,S | Gerar lote, export, marcar pago | financeiro/admin | `Table`, `AlertDialog` |
| 13 | `GeneratePayoutBatchDialog` | modal | S,Er | Select competência, preview totais | financeiro | `Dialog` |
| 14 | `RepPortalShell` | `/painel/comercial/*` | S,P | Nav mínimo, logout | `sales_rep` | **Novo** layout — similar slim shell |
| 15 | `RepExtratoPage` | `/comercial/extrato` | L,E,S,Er | Cards resumo + tabela read-only | rep próprio | `Card`, `Table` |
| 16 | `RepBankFormPage` | `/comercial/dados-pagamento` | S,Er | Editar próprio PIX | rep próprio | Reuse #5 read/write own |
| 17 | `DeactivateRepDialog` | modal | Er | Bloqueio se carteira não repassada | admin | `AlertDialog` |
| 18 | Toasts / banners | global | — | Copy UX Writer §3–12 | — | `toast`, `Alert` |

---

## 5. Mapa design system (`@autopainel/shared/ui`)

| Necessidade | Primitivas existentes | Novo em `packages/shared`? |
| --- | --- | --- |
| Listagens densas | `Table`, `Badge`, `Button`, `DropdownMenu` | Não |
| Formulários | `Input`, `Label`, `Select`, `Textarea`, `Card` | Não |
| Wizard repasse | `Button`, `Card`, indicador passo | **Sim:** `Stepper` leve (ou composição documentada) |
| Drawer vínculo | `Sheet`, `SheetHeader`, `Form` | Não |
| Valores monetários | Formatar com `Intl.NumberFormat` pt-BR | **Sim:** `CurrencyDisplay` helper (opcional) |
| Máscara PIX/CPF | — | **Sim:** `maskPixKey`, `maskCpf` em `lib/format` |
| Bulk actions extrato | `Checkbox` coluna + toolbar | Não |
| Filtro competência | `Select` mês/ano ou date picker | Reuse se `Calendar` já no shared |
| Empty / loading | `EmptyState`, `Skeleton` | Não |
| Confirmações destrutivas | `AlertDialog` | Não |

**Padrão visual:** seguir `SalesRepsListPage` / `platform-store-users-table.tsx` / `leads-comerciais` — cards com `border-border shadow-sm`, filtros em row responsiva, tabela `overflow-x-auto`.

**Cores semânticas:**

| Status ledger | Badge variant |
| --- | --- |
| pending | `secondary` |
| approved | `outline` |
| paid | `default` |
| cancelled / clawback | `outline` + `text-destructive` |

---

## 6. Whitelabel e tenant

Este épico é **100% plataforma AutoPainel** — sem whitelabel por concessionária.

- Logo e cores: tema admin padrão (`admin-master`).
- Nomes de lojas aparecem como texto dinâmico (truncate com `title` tooltip se > 40 chars).
- Portal rep: mesma identidade AutoPainel (não confundir com painel da loja).

---

## 7. Responsivo

| Breakpoint | Comportamento |
| --- | --- |
| Mobile (&lt;768px) | **Portal rep:** layout primário. Admin comercial: tabelas scroll horizontal; wizard repasse full-screen steps; drawer vínculo vira `Sheet` bottom |
| Tablet (768–1024px) | Form 1 coluna; tabs equipe scroll horizontal |
| Desktop (&gt;1024px) | **Primário admin.** Form 2 colunas; ficha rep sidebar resumo (carteira count, próximo pagamento) + tabs conteúdo |

---

## 8. Edge cases (copy do UX Writer)

| Situação | Onde | O que o usuário vê |
| --- | --- | --- |
| Sem reps | Lista | Empty + «Cadastrar primeiro representante» |
| Rep sem lojas | Carteira | Empty carteira |
| Rep sem PIX | Portal rep | Banner «Cadastre sua chave PIX» |
| Split &gt; 100% | Drawer vínculo | Toast erro split |
| Último rep ativo inativar | Modal | Erro lojas pendentes |
| Rep acessa admin | Middleware | Redirect `/painel/comercial/extrato` ou 403 |
| Operador admin acessa portal rep | — | N/A (rotas separadas) |
| Lote sem aprovados | Gerar lote | Empty / disabled CTA |
| Churn 30d | Ficha loja + extrato | Banner + linha estorno |

---

## 9. Wireframes ASCII (referência)

### Lista representantes (desktop)

```
┌─────────────────────────────────────────────────────────────┐
│ Representantes comerciais              [+ Novo representante]│
│ Cadastre a equipe...                                         │
├─────────────────────────────────────────────────────────────┤
│ [Buscar...        ] [Status ▼]                    12 de 12   │
├──────────┬─────────────┬────────┬──────────┬────────┬───────┤
│ Nome     │ E-mail      │ Lojas  │ Comissão │ Status │  ⋮    │
├──────────┼─────────────┼────────┼──────────┼────────┼───────┤
│ Ana S.   │ ana@...     │ 5      │ 10%      │ Ativo  │  ⋮    │
└──────────┴─────────────┴────────┴──────────┴────────┴───────┘
```

### Portal rep — Meu extrato (mobile)

```
┌──────────────────────┐
│ AutoPainel  Extrato  │
├──────────────────────┤
│ A receber    R$ 840  │
│ Próx. pag.   10/jul  │
├──────────────────────┤
│ Jun/2026             │
│ Loja X    R$ 39,70 ✓ │
│ Loja Y    R$ 69,70 ⏳│
└──────────────────────┘
```

### Wizard repasse (step 2)

```
┌────────────────────────────────────────┐
│ Repasse de carteira          Step 2/3  │
│ Data início: [ 01/07/2026 ]            │
│ ☑ Todas as lojas (8)                   │
│ ☐ EcoDrive Seminovos                   │
│ ☐ QA Finance Loja A                    │
│              [Voltar]  [Continuar]     │
└────────────────────────────────────────┘
```

---

## 10. Permissões (matriz UX)

| Ação | super_admin | finance_admin (futuro) | sales_rep |
| --- | --- | --- | --- |
| CRUD reps | ✅ | ❌ | ❌ |
| Ver PIX completo outros | ✅ | ✅ | ❌ |
| Editar próprio PIX | — | — | ✅ |
| Aprovar ledger | ✅ | ✅ | ❌ |
| Gerar lote / marcar pago | ✅ | ✅ | ❌ |
| Ver extrato qualquer rep | ✅ | ✅ | ❌ |
| Ver próprio extrato | — | — | ✅ |
| Repasse carteira | ✅ | ❌ | ❌ |

v1: apenas `super_admin` + `sales_rep` (portal). Flag `finance_admin` como extensão documentada.

---

## 11. Flags para Arquiteto (Fase 4)

1. **RLS:** rep só `SELECT` ledger onde `sales_rep_id = auth rep`; admin service role ou policy `super_admin`.
2. **RPC:** `transfer_sales_rep_portfolio`, `generate_monthly_commissions`, `generate_payout_batch`, `clawback_dealership_churn`.
3. **Auth:** role ou tabela `platform_sales_reps.user_id` — middleware `/painel/comercial/*`.
4. **Integração:** evento `confirmed` ao ativar loja ou assinar contrato — hook desde leads/contratos.
5. **Componentes shared novos:** `Stepper`, `CurrencyDisplay`, máscaras PIX.

---

## 12. Fora de escopo UX v1

- App mobile nativo
- Rep editar comissão ou split
- Notificações e-mail (copy reservada Fase 2 §14)
- Dashboard gráficos comercial (só tabelas + cards resumo)

---

**Design aprovado?** Próximo passo: **Fase 4 — Arquiteto Supabase** (migrações, RLS, RPCs, tipos TypeScript).
