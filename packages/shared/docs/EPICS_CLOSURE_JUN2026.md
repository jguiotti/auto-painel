# Fechamento de épicos — junho/2026

> **Atualizado:** 2026-06-25 · Growth Operations + campanha trial **fechados em código**. Pendências restantes são **operacionais** (1ª loja paga, OAB, QA manual).

---

## Verificação automatizada (rodar antes de declarar go-live)

```bash
# Smoke HTTP produção (11 checks hard + www soft warning)
npm run smoke:production-go-live

# E2E login demo vitrine + painel (produção)
E2E_PRODUCTION=true npm run test:e2e -- e2e/specs/production-go-live.spec.ts

# Tudo junto
npm run verify:epics-closure

# Cron billing (local, service role)
npm run admin:billing-notifications:scan
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
| **Trial Essencial** | Campanha onboarding | ✅ | smoke manual | QA upload cross-browser |
| **Growth Operations** | Estoque, upgrade, contratos, admin | ✅ | parcial | QA manual aceite contrato + stock limit |

---

## Growth Operations — fechado (jun/2026)

**Entregue:**

- Limite estoque 10/30/∞ + modal upgrade + FAB WhatsApp (dealership-panel)
- Contrato v3 Pix-only + opt-in triplo + `/aceite-contrato/[token]`
- Admin: notificações (`/painel/notificacoes`), solicitações upgrade, financeiro interno
- Leads: excluir, atribuir representante; trial: revisão assets + upload wizard
- Foro **Mongaguá/SP** (web + templates DB)
- Cron billing: `admin-billing-notifications-cron.yml` + `npm run admin:billing-notifications:scan`
- CI lead e-mail: `lead-notification-dispatch.yml` (secrets `SUPABASE_URL`)

**Migrações (aplicar com `npm run supabase:deploy`):**

| Migração | Conteúdo |
| --- | --- |
| `20260624150000` | Stock limits + admin notifications + billing scan RPC |
| `20260624150100` | Contrato v3 + trial opt-in RPCs |
| `20260625120000` | Delete admin notifications |
| `20260625130000` | Delete support requests |
| `20260625140000` | Financeiro interno plataforma |
| `20260625150000` | Foro Mongaguá nos templates |

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

1. Contrato v3 + aceite eletrônico (admin `/painel/contratos` — template versão 3)
2. Criar loja no admin + `npm run dealership:hosts:provision -- <slug>`
3. Auth Redirect URLs no Supabase para novos domínios
4. Primeiro Pix pago → go-live

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

## GitHub Actions — secrets necessários

| Workflow | Secrets |
| --- | --- |
| `lead-notification-dispatch.yml` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `integration-workers-cron.yml` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTEGRATION_WORKERS_CRON_SECRET` |
| `admin-billing-notifications-cron.yml` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `platform-sales-cron.yml` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

Configurar workers: `npm run github:secrets:workers:manual`

---

## Referências

- `PLATFORM_BACKLOG_REMAINING.md` — backlog vivo
- `documentacao-tecnica.md` — rastreabilidade
- `regras-de-negocio.md` — BZ Growth Operations + trial
- `CONTRATO_SAAS_ASSINATURA_PLATAFORMA.md` — modelo jurídico (revisão OAB)
