# Fechamento de épicos — junho/2026

> **Atualizado:** 2026-06-24 · Escopo fechado em código/QA, exceto **Meta** e itens **operacionais** (1ª loja cliente paga).

---

## Verificação automatizada (rodar antes de declarar go-live)

```bash
# Smoke HTTP produção (11 checks hard + www soft warning)
npm run smoke:production-go-live

# E2E login demo vitrine + painel (produção)
E2E_PRODUCTION=true npm run test:e2e -- e2e/specs/production-go-live.spec.ts

# Tudo junto
npm run verify:epics-closure
```

**Última execução local (2026-06-21):** smoke 11/11 OK · E2E produção 1/1 OK · www.autopainel.com.br = WARN DNS (ver checklist).

---

## Status por épico

| Épico | Nome | Código | QA automático | Pendente |
| --- | --- | --- | --- | --- |
| **0** | Decisões PM | ✅ | — | — |
| **1** | UX mobile + copy | ✅ base | E2E visual smoke | Copy residual opcional |
| **2** | Workers integração | ✅ | E2E integrações UX/OAuth | Auto-publish P2 · Meta **bloqueado** |
| **3** | Go-live multitenant | ✅ | smoke + E2E prod | **1ª loja cliente** + `custom_domain` + Auth URLs |
| **4** | Operação admin polish | ✅ | — | — |
| **5** | QA encerramento | 🟡 | smoke/E2E prod OK | Regressão E2E local admin :3001 |
| **Crescimento P4** | Wizard + CRM | ✅ | CRM E2E spec | Guerrilla marketing (produto) |
| **Sales Squad** | Comercial B2B | ✅ v1.1 | RLS + E2E | Campanhas incentivo (opcional) |
| **CRM loja** | Contatos enriquecidos | ✅ | `crm-storefront-panel.spec.ts` | — |

---

## Épico 3 — declarado fechado (base técnica)

**Entregue:**

- Wildcard DNS + demos showcase (guiotti, demo, demo-2, demo-3)
- Smoke `smoke:production-go-live`
- E2E `production-go-live.spec.ts`
- Redirect www → apex no `marketing-site` (DNS www ainda pendente na Cloudflare)
- Vitrine inativa + painel `/conta-inativa`
- Auto-provision hosts pós-create loja

**Operação (único bloqueio de go-live comercial):**

1. Fechar contrato v2 (admin `/painel/contratos` — template versão 2 após migração `20260621150000`)
2. Criar loja no admin + `npm run dealership:hosts:provision -- <slug>`
3. Auth Redirect URLs no Supabase para novos domínios
4. Primeiro boleto pago → go-live

Ver: `PRODUCTION_GO_LIVE_WAVE_A.md`, `DEALERSHIP_HOSTS_PROVISIONING.md`

---

## Épico 4 — fechado

EmptyState listagens admin, `fetchDealershipsForAdminList`, KPIs, command palette, filtros URL — entregues jun/2026.

---

## Épico 5 — fechado (onda produção)

| Check | Status |
| --- | --- |
| Smoke multitenant produção | ✅ |
| E2E login demo produção | ✅ |
| Cross-tenant E2E (local com seed) | ✅ spec existente |
| CRM vitrine ↔ painel | ✅ `crm-storefront-panel.spec.ts` |
| Platform Sales Squad RLS | ✅ `qa:platform-sales-squad-rls` |
| Matriz integrações manual credenciais | ⏸ OLX/WM homologados; Meta bloqueado |

---

## Bloqueios externos (não fechar)

| Item | Motivo |
| --- | --- |
| Meta Lead Ads / CAPI | Homologação Meta |

---

## Migrações pós-commit (aplicar se ainda não)

| Migração | Conteúdo |
| --- | --- |
| `20260621120000_lead_profile_enrichment.sql` | RPC perfil lead |
| `20260621140000_lead_vehicle_interests.sql` | N veículos de interesse |
| `20260621150000_platform_contract_template_v2.sql` | Template contrato v2 admin |

```bash
npm run supabase:deploy
```

---

## Referências

- `PLATFORM_BACKLOG_REMAINING.md` — backlog vivo
- `documentacao-tecnica.md` — rastreabilidade
- `CONTRATO_SAAS_ASSINATURA_PLATAFORMA.md` — modelo jurídico (revisão OAB)
