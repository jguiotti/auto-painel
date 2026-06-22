# Documentação técnica — AutoPainel

> Referência para **desenvolvedores** e DevOps. Estrutura inspirada em docs de produto (Shopify-style): comece pelo setup, depois APIs, integrações e deploy.

**Histórico detalhado de PRDs e migrações antigas:** `historico-tecnico.md` e `historico-prds.md` no mesmo diretório (somente git).

---

## Índice

1. [Stack e arquitetura](#stack-e-arquitetura)
2. [Primeiros passos](#primeiros-passos)
3. [Monorepo e apps](#monorepo-e-apps)
4. [Variáveis de ambiente](#variáveis-de-ambiente)
5. [Supabase](#supabase)
6. [APIs e RPCs](#apis-e-rpcs)
7. [Integrações](#integrações)
8. [Analytics (GTM + GA4)](#analytics-gtm--ga4)
9. [Deploy](#deploy)
10. [Testes](#testes)
11. [Documentação complementar](#documentação-complementar)

---

## Stack e arquitetura

| Camada | Tecnologia |
| --- | --- |
| Frontend | **Next.js** (App Router), **React**, **TypeScript** |
| Estilo | **Tailwind CSS v4**, **shadcn/ui** em `packages/shared` |
| Backend / dados | **Supabase** (Postgres, Auth, Storage, Edge Functions) |
| Monorepo | **npm workspaces** + **Turborepo** |
| Hospedagem | **Vercel** (4 projetos, um por app) |
| CI | **GitHub Actions** (migrações Supabase, workers, health ping) |
| E2E | **Playwright** |

### Multitenant

- Cada concessionária = linha em `dealerships` com `slug` único.
- Resolução de tenant por **hostname** (`{slug}.autopainel.com.br`, `{slug}.loja.autopainel.com.br`).
- **RLS** no Postgres isola dados por `dealership_id`.
- Módulos efetivos: RPC `effective_feature_keys_for_active_dealership` (plano + pivot `pricing_plan_modules`).

### Diagrama simplificado

```
┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  ┌──────────────┐
│ marketing   │  │ admin       │  │ dealership-panel │  │ customer-site│
│   :3000     │  │   :3001     │  │      :3002       │  │    :3003     │
└──────┬──────┘  └──────┬──────┘  └────────┬─────────┘  └──────┬───────┘
       │                │                   │                    │
       └────────────────┴───────────────────┴────────────────────┘
                                    │
                          packages/shared (UI, Supabase clients, types)
                                    │
                          Supabase (Postgres + Auth + Edge Functions)
                                    │
                    Workers (GitHub Actions cron) → Meta, classificados
```

---

## Primeiros passos

### Pré-requisitos

- Node.js **20+**, npm **10+**
- Docker Desktop (Supabase local)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Git (clone **fora** de iCloud/Drive)

### Instalação

```bash
git clone https://github.com/jguiotti/auto-painel.git
cd auto-painel
npm install
cp .env.example .env.local
# Preencha .env.local
npm run sync:env
npm run supabase:start
npm run dev:all
```

| App | Porta | URL local |
| --- | ---: | --- |
| Marketing | 3000 | http://localhost:3000 |
| Admin | 3001 | http://localhost:3001 |
| Painel loja | 3002 | http://localhost:3002 |
| Vitrine | 3003 | http://localhost:3003 |

**Vitrine/painel com slug local:** `http://guiotti.localhost:3003` (requer hosts ou middleware de dev — ver `TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md`).

### Seeds úteis

```bash
npm run seed:demo-users      # usuários das lojas demo
npm run seed:admin-user      # super admin (config no script)
npm run supabase:reset       # recria BD + migrações
```

---

## Monorepo e apps

```
apps/
  marketing-site/       Site institucional
  admin-master/         Painel plataforma (super_admin)
  dealership-panel/     Painel concessionária
  customer-site/        Vitrine pública
packages/
  shared/
    src/ui/             Componentes shadcn
    src/lib/supabase/   Clientes server/browser
    src/types/          Tipos RPC e tabelas
    docs/               Docs cross-cutting
supabase/
  migrations/           Schema versionado
  functions/            Edge Functions Deno
```

### Convenções de código

- **Código e comentários:** inglês.
- **URLs:** português (`/painel`, `/estoque`, `/veiculo/[slug]`).
- **UI copy:** pt-BR.
- **shadcn:** instalar só em `packages/shared` — `npm run ui:add -- <component>`.

### Scripts npm (raiz)

| Script | Uso |
| --- | --- |
| `dev:all` / `dev:lite` | Desenvolvimento |
| `sync:env` | Copia `.env.local` para apps |
| `supabase:start` / `reset` / `deploy` | Banco local e remoto |
| `dealership:hosts:provision -- <slug>` | DNS/Vercel por loja |
| `integration:secrets:configure` | Secrets integrações no Supabase |
| `meta:config:smoke` | Smoke test config Meta |
| `test:e2e` | Playwright |

Lista completa: `package.json` na raiz.

---

## Variáveis de ambiente

Fonte: `.env.example` na raiz. Após editar: `npm run sync:env`.

| Variável | Apps | Descrição |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Todos | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Todos | Chave anon/publicável |
| `SUPABASE_SERVICE_ROLE_KEY` | Scripts/server | Nunca expor no cliente |
| `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` | Painel/vitrine | Ex.: `autopainel.com.br` |
| `NEXT_PUBLIC_GTM_ID` | Todos | Container GTM (`GTM-MV99ZXW9`) |
| `SOCIAL_PUBLISH_DRY_RUN` | Workers | `true` = não publica de verdade na Meta |

Segurança: `packages/shared/docs/SECURITY_SECRETS.md`.

---

## Supabase

### Projeto remoto

- **Ref:** `wcgevmvystdhqpzwuyig`
- Migrações: `supabase/migrations/` — **nunca** `db push` automático pelo agente; operador aplica via Dashboard ou `npm run supabase:deploy`.

### Comandos

```bash
npm run supabase:status
npm run supabase:migrations:status
npm run supabase:deploy
npm run supabase:ping:remote
```

### Edge Functions

| Função | Função |
| --- | --- |
| `platform-health-ping` | Keep-alive instância |
| `meta-oauth-start` / `meta-oauth-callback` | OAuth Meta |
| `classifieds-sync-worker` | Sync OLX/WebMotors/iCarros |
| `social-publish-worker` | Publicação FB/IG |

Invocação workers: GitHub Actions cron (15 min) — ver `INTEGRATIONS_DEPLOY.md`.

### Tabelas principais (referência)

| Tabela | Propósito |
| --- | --- |
| `dealerships` | Tenant, slug, plano, layout |
| `profiles` | Usuários + role + `dealership_id` |
| `vehicles` | Estoque |
| `leads` | CRM |
| `saas_modules` / `pricing_plans` / `pricing_plan_modules` | Catálogo e composição de planos |
| `dealership_integration_accounts` | Tokens OAuth por loja |

---

## APIs e RPCs

Tipos TypeScript: `packages/shared/src/types/supabase-rpc.ts`.

### RPCs usadas no frontend

| RPC | Uso |
| --- | --- |
| `effective_feature_keys_for_active_dealership` | Módulos efetivos da loja logada |
| `list_dealership_meta_page_candidates` | Páginas FB disponíveis no connect Meta |
| `upsert_dealership_social_carousel_settings` | Config carrossel redes sociais |

### Server Actions / rotas

- **Admin:** `apps/admin-master/src/actions/` — CRUD concessionárias, docs, equipe.
- **Excluir concessionária:** `deleteDealershipAction` remove recibos, leads, usuários Auth (`profiles`) e depois a linha em `dealerships`; Guiotti/Demo bloqueadas (trigger + app). UI exibe erro no dialog.
- **Painel:** `apps/dealership-panel/src/actions/` — estoque, leads, integrações.
- **OAuth callbacks:** rotas API em cada app + Edge Functions Supabase.

### Autenticação

- Supabase Auth (e-mail/senha).
- Sessão via cookies (`@supabase/ssr`).
- Platform ops: `profiles.role = 'super_admin'` e `dealership_id IS NULL`.

---

## Integrações

| Integração | Doc | Estado |
| --- | --- | --- |
| **Meta FB/IG** | `META_INTEGRATION_SIMPLIFIED.md` | Connect OK; App Review em curso |
| **OLX** | `CLASSIFIEDS_OAUTH_SETUP.md` | OAuth scaffold |
| **WebMotors** | `CLASSIFIEDS_INTEGRATORS_BLUEPRINT.md` | Password grant + worker |
| **iCarros** | `CLASSIFIEDS_OAUTH_SETUP.md` §3 | Connect password |

Deploy secrets e workers: `INTEGRATIONS_DEPLOY.md`.

### Nova loja (DNS)

```bash
npm run dealership:hosts:provision -- <slug>
```

Guia: `DEALERSHIP_HOSTS_PROVISIONING.md`.

---

## Analytics (GTM + GA4)

- **Container:** `GTM-MV99ZXW9` (conta Auto Painel / `autopainel.com.br`).
- Código: `packages/shared/src/components/analytics/`, helper `push-autopainel-analytics-event.ts`.
- **Vitrine — compartilhamento:** `vehicle-share-section.tsx` (compacto, abaixo do preço). Facebook usa Open Graph da ficha (`build-vehicle-page-metadata.ts`: imagem, título, preço).
- **Eventos v1 expandidos (2026-06):** marketing `cta_click`, `whatsapp_click`, consent; vitrine `vehicle_share_click`, `vehicle_detail_view`, `lead_submit`, `finance_simulation` — ver catálogo.
- **Não** criar eventos `ap_*` no GA4 com “Criar sem código” — eles vêm do **GTM** via dataLayer.

**Passo a passo completo (operacional):** [`GTM_GA4_SETUP.md`](../../../packages/shared/docs/GTM_GA4_SETUP.md)  
**Catálogo de eventos:** [`GTM_EVENTS.md`](../../../packages/shared/docs/GTM_EVENTS.md)  
**Dev com banco remoto (recomendado):** [`SUPABASE_REMOTE_DEV.md`](../../../packages/shared/docs/SUPABASE_REMOTE_DEV.md)

### Excluir tráfego interno (IP da equipe)

Duas camadas recomendadas (use as duas):

1. **Código** — `GA4_INTERNAL_TRAFFIC_IPS` no `.env.local` (já configurado).
2. **GA4 Admin** — **não** é em «Definições personalizadas»; use **Coleta e modificação de dados** → **Fluxos de dados** (regra IP) + **Filtros de dados** (excluir). Ver [`GTM_GA4_SETUP.md`](../../../packages/shared/docs/GTM_GA4_SETUP.md) § «Excluir tráfego interno» Passos A e B.

---

### Checklist validação GA4 (operacional)

1. **GTM Preview** — abrir site (marketing ou vitrine) com preview ligado; confirmar tag **Tag GA** dispara em Initialization.
2. **Variáveis dataLayer** — no preview, evento de página deve expor `ap_app_surface`, `ap_dealership_slug` (vitrine).
3. **DebugView** — Admin GA4 → DebugView (ou extensão GA Debugger); navegar e clicar CTA/WhatsApp/compartilhar veículo; ver hits `ap_custom_event` com `ap_event` correto.
4. **Dimensões** — Admin GA4 → **Definições personalizadas** → criar 5 dimensões `ap_*` (não em Fluxos de dados).
5. **Conversões** — Admin → Eventos → marcar como principal: `lead_form_submit`, `lead_submit`, `whatsapp_click`, `cta_click` (conforme funil).
6. **Compartilhamento** — vitrine `/veiculo/[slug]` → clicar WhatsApp/Facebook; GTM deve registrar `vehicle_share_click` + `ap_event_label`.

Se pageviews aparecem mas eventos custom não: falta acionador `ap_custom_event` + tag **GA4 — Event — AP Custom** no GTM (ver `GTM_GA4_SETUP.md` § B.4–B.5).

---

## Gestão de usuários (admin-master)

| Rota | Público | Ação |
| --- | --- | --- |
| `/painel/usuarios` | Titular, gestor, vendedor (`dealership_id` preenchido) | Listagem, filtros, remoção |
| `/painel/equipe` | Operadores `super_admin` (sem loja) | Listagem, remoção (mín. 1 operador) |

**Arquivos:** `lib/data/platform-users.ts`, `actions/platform-users.ts`, `lib/auth/delete-auth-user-or-orphan-profile.ts`, componentes `platform-*-users-table.tsx`.

**Perfis órfãos:** linha em `profiles` sem `auth.users` — remoção apaga só o profile; destrava exclusão de concessionária (`purgeDealershipTenantData`).

**Equipe comercial (vendedores internos):** PRD + copy + UX + schema — [`PRD_PLATFORM_SALES_SQUAD.md`](../../../packages/shared/docs/PRD_PLATFORM_SALES_SQUAD.md), migração **`20260620180000_platform_sales_squad.sql`**, arquitetura **`PLATFORM_SALES_SQUAD_ARCHITECTURE.md`**, tipos **`platform-sales-squad.ts`**.

---

## E-mail transacional (Auth) — Fase 2 (Resend whitelabel)

Régua PM + copy UX Writer: [`EMAIL_COMMUNICATION_REGUA.md`](../../../packages/shared/docs/EMAIL_COMMUNICATION_REGUA.md).

Setup Resend + Supabase SMTP/templates/redirect URLs: [`EMAIL_RESEND_SETUP.md`](../../../packages/shared/docs/EMAIL_RESEND_SETUP.md).

| ID | Evento | Marca | Código |
| --- | --- | --- | --- |
| **LOJ-01** | Convite colaborador (boas-vindas) | Loja (`theme_config`, logo) | `packages/shared/src/lib/email/send-dealership-auth-email.ts` → `sendDealershipWelcomeEmail` |
| **LOJ-02** | Recuperar senha painel | Loja | `apps/dealership-panel/src/app/(auth)/actions.ts` |
| **ADM-02** | Recuperar senha admin | AutoPainel (logo color) | `apps/admin-master/src/actions/auth-recovery.ts` |
| **TRIAL-01** | Onboarding trial marketing | AutoPainel | `apps/marketing-site/src/lib/email/send-trial-onboarding-email.ts` |

Link Auth: `generateAuthEmailActionLink` → URL direta `/auth/confirm?token_hash=…&type=invite|recovery` + `verifyOtp`/`exchangeCodeForSession` em `handleAuthConfirmRequest` — **não** usa `action_link` Supabase (evita cair no login sem sessão).

| Superfície | Rotas | Env obrigatório |
| --- | --- | --- |
| Admin | `/recuperar-senha`, `/definir-senha`, `/auth/confirm` | `RESEND_API_KEY`, `NEXT_PUBLIC_ADMIN_AUTH_REDIRECT_ORIGIN` |
| Painel loja | `/recuperar-senha`, `/definir-senha`, `/auth/confirm` | `RESEND_API_KEY`, `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` |
| Marketing | `/adesao-trial` | `RESEND_API_KEY` |

Convite colaborador: `dealership-collaborators.ts` + `invite-dealership-collaborator.ts` → `sendDealershipWelcomeEmail`.

Templates SMTP fallback: `supabase/templates/invite.html`, `recovery.html`. Local: `supabase/config.toml`.

Logo AutoPainel em e-mails: `apps/marketing-site/public/logo-autopainel-horizontal-color.png` (mesmo asset do admin-master).

Fase 3 (pendente): LOJ-04 exclusão perfil, e-mail de novo lead whitelabel.

**Épico Fase 1 (e-mail + DNS multitenant) — encerrado 2026-06-17:** Resend + Supabase SMTP produção, wildcards Cloudflare, provisionamento Vercel por slug, rotas Auth admin/painel, convite colaborador com e-mail.

**Épico feedback operacional (jun/2026) — encerrado 2026-06-19** (commit `237e20a`, deploy Vercel admin/painel/vitrine + Supabase remoto):

| Onda | Entregue |
| --- | --- |
| **P0** | WhatsApp modal ficha + hero test drive; QR URL vitrine; claim lead + badge Contatos |
| **P1** | Estoque filtros/paginação/ordem destaques; CRM status/motivo perda + exclusão via `ConfirmActionDialog`; filtros mobile vitrine (tema escuro) |
| **P2** | QR A4 paisagem + texto promo; recibo pré-preenche via lead; delist por portal; equipe só owner + convite painel; Edge `notify-dealership-new-lead`; logo claro/escuro admin |

| Pós-deploy operador | Ação |
| --- | --- |
| Resend | `RESEND_API_KEY` real no Supabase Edge (Dashboard → API Keys) |
| Local pós-reset | `npm run supabase:reset:dev` ou `npm run seed:local-access` |
| Vercel vitrine prod | projeto **`auto-painel-customer-site`** (não usar `autopainel-customer` — removido como duplicata) |

| Área | Paths / contratos |
| --- | --- |
| Edge e-mail lead | `supabase/functions/notify-dealership-new-lead`, cron `.github/workflows/lead-notification-dispatch.yml`, `scripts/dispatch-lead-notification-worker.mjs` |
| Convite equipe (painel) | `packages/shared/src/lib/auth/invite-dealership-collaborator.ts`, `apps/dealership-panel/src/app/painel/equipe/actions.ts` |
| Equipe — editar colaborador | `EmployeeEditDialog` + `FormDialogShell` (shared); foto via `FileUploadField` → upload `dealership-branding/employees/` (`upload-employee-photo.ts`) |
| Logo dual | `theme_config.logo_light_url` (marca clara) / `logo_dark_url` (marca escura), admin `dealership-form.tsx`, `resolveDealershipLogoForLightBackground` / `ForDarkBackground` |

Secrets Edge: `RESEND_API_KEY`, opcional `LEAD_NOTIFICATION_FROM_EMAIL`.

**Aplicar local:** `npm run supabase:reset`; deploy Edge: incluir `notify-dealership-new-lead` no manifest.

---

## Épico crescimento & operação (jun/2026) — em andamento

| Onda | Escopo | Status |
| --- | --- | --- |
| **P0** | Telefone marketing `+55 13 99743-5851`; doc Email Routing | Entregue |
| **P1** | Preços públicos; vitrine `/loja-inativa`; CRM `/painel/leads-comerciais`; painel `/conta-inativa` | Entregue (base) |
| **P2** | Contratos; auto-provision pós-create; Guiotti/Demo protegidas | Entregue |
| **P3** | Dashboard admin + GA4 + calendário conteúdo | Entregue (base) |
| **P4** | Wizard painel; lead enriquecido + multi-interesse estoque; marketing guerrilla | ✅ wizard + CRM; guerrilla pendente (produto) |

| Área | Paths / contratos |
| --- | --- |
| Migração P1 | `supabase/migrations/20260620120000_growth_epic_pricing_storefront_crm.sql` |
| Migração P2 contratos | `supabase/migrations/20260620140000_growth_epic_platform_contracts.sql` |
| Migração P3 calendário | `supabase/migrations/20260620150000_growth_epic_content_calendar.sql` |
| Contratos admin | `/painel/contratos`, `/painel/contratos/novo`, `/painel/contratos/[id]` |
| Calendário admin | `/painel/calendario-conteudo` |
| Build fix CRM | `platform-commercial-leads-shared.ts` (sem `server-only`) vs `platform-commercial-leads.ts` |
| Preços marketing | `marketing-plan-prices.ts` — 197 / 397 / 997 + setup **obrigatório** 497 + faixas estoque; migração `20260620160000` |
| Vitrines demo (marketing) | Slugs `demo-2` (layout 1), `demo-3` (layout 2), `demo` (layout 3) — links na home `marketing-showcase.tsx`; painel em `{slug}.loja.autopainel.com.br` com login partilhado `gestor.demo@autopainel.demo` / `LojaDemo123!` (RPC `bind_showcase_demo_panel_dealership`, migração `20260620190300`). Nova loja demo: `npm run dealership:hosts:provision -- <slug>`. Estoque showcase: migração `20260620190000_seed_showcase_demo_vehicles.sql` (20 veículos/loja, 4 fotos cada, prefixo `showcase-`); regerar catálogo: `node scripts/generate-showcase-demo-vehicles-migration.mjs`. Hero layout 2: `home-hero.tsx` centralizado verticalmente |
| Vitrine inativa | RPC `resolve_dealership_storefront_tenant`, `get_dealership_storefront_shell_by_id`; rota `customer-site` `/loja-inativa` |
| Painel inativo | `require-dashboard-session.ts` → `/conta-inativa` (status ≠ `active`) |
| CRM B2B | `saas_prospects.pipeline_status`; admin `/painel/leads-comerciais` (cadastro manual + atalhos contrato/loja) |
| Lojas internas | `dealerships.billing_exempt`; trigger `enforce_internal_dealership_protection` (slugs `guiotti`, `demo`) |
| Auto-provision | `provisionDealershipHostsInBackground` em `createDealershipAction` → `scripts/dealership-hosts-provision.mjs --cloudflare` |
| Email routing | `packages/shared/docs/CLOUDFLARE_EMAIL_ROUTING.md` |
| WhatsApp marketing | Popup único `MarketingWhatsAppProvider` — **sem** link `wa.me`; lead → `saas_prospects` |
| Migração P4 | `supabase/migrations/20260620170000_growth_epic_p4_manual_lead_enrichment.sql` |
| Wizard painel | `panel-onboarding-wizard.tsx` — cookie `ap_panel_onboarding_v1`, 1× por navegador |
| Lead manual enriquecido | `create-manual-lead-dialog.tsx` — CPF/CNPJ + endereço; RPC `create_dealership_manual_lead` com `customer_id` |

---

## Equipe comercial AutoPainel (Platform Sales Squad)

| Fase squad | Status |
| --- | --- |
| 1–4 PM / UX / Arquiteto | ✅ PRD, copy, UX, migração `20260620180100_platform_sales_squad.sql` |
| **5 Backend** | ✅ Actions, data layer, auth portal rep, hook estorno churn |
| **6 Frontend** | ✅ Admin `/painel/equipe/comercial/*` + portal rep `/painel/comercial/*` (v1) |
| **8 QA** | ✅ Matriz + Playwright + script RLS local — `PLATFORM_SALES_SQUAD_QA.md` (6 pass + 1 skip E2E com dev servers) |
| 7 DevOps | ✅ Cron comissão/lote v1.1 |

**Épico v1 fechado** (2026-06-20): escopo admin + portal rep + QA automatizado. Backlog v1.1: campanhas, lotes pagamento, drawer vínculo leads/contratos — `PLATFORM_BACKLOG_REMAINING.md`.

| Área | Paths / contratos |
| --- | --- |
| Migração | `supabase/migrations/20260620180100_platform_sales_squad.sql`, fix RLS `20260620190100_fix_platform_sales_reps_select_own_rls.sql` |
| Tipos | `packages/shared/src/types/platform-sales-squad.ts`, `supabase-rpc.ts` |
| Arquitetura | `packages/shared/docs/PLATFORM_SALES_SQUAD_ARCHITECTURE.md` |
| Backlog restante | `packages/shared/docs/PLATFORM_BACKLOG_REMAINING.md` |
| Actions admin | `platform-sales-reps.ts`, `platform-sales-attributions.ts`, `platform-sales-portfolio.ts`, `platform-sales-ledger.ts`, `platform-sales-incentives.ts` |
| Data layer | `lib/data/platform-sales-squad.ts`, `platform-sales-squad-shared.ts` |
| Auth painel | `require-platform-painel-access.ts` — rep só em `/painel/comercial/*`; `RepPortalShell` layout mínimo |
| UI admin | `/painel/equipe/comercial`, `/novo`, `/[repId]`, `/[repId]/extrato`, `/[repId]/repasse` — components `platform-sales-*` |
| UI rep | `/painel/comercial/extrato`, `/carteira`, `/dados-pagamento` |
| Estorno churn | `lib/commercial/run-dealership-churn-clawback.ts` + `updateDealershipAction` quando status → `churned` |
| RPCs | `transfer_sales_rep_portfolio`, `confirm_dealership_sales_attribution`, `clawback_dealership_sales_commissions`, `approve_sales_commission_ledger_entries` |
| QA Fase 8 | `packages/shared/docs/PLATFORM_SALES_SQUAD_QA.md` · `e2e/specs/platform-sales-squad.spec.ts` · `npm run qa:platform-sales-squad-rls` · seed `npm run seed:platform-sales-rep-qa` |

**Bloqueado externamente (fora deste épico):** integração Meta e iCarros — ver `PLATFORM_BACKLOG_REMAINING.md`.

---

## Estoque — paginação vitrine e painel (2026-06-20)

| Superfície | Comportamento |
| --- | --- |
| **Vitrine** `/estoque` | 12 veículos/página; query `?page=`; sort server-side via RPC; barra Anterior/Próxima |
| **Painel loja** `/painel/estoque` | 20 veículos/página (já existia); copy «Mostrando X–Y de Z» na paginação e toolbar |

| Artefato | Path |
| --- | --- |
| Migração | `supabase/migrations/20260620190200_storefront_inventory_pagination.sql` — `list_public_vehicles_filtered` (`p_limit`, `p_offset`, `p_sort`) + `count_public_vehicles_filtered` |
| Tipos RPC | `packages/shared/src/types/supabase-rpc.ts` |
| Vitrine page | `apps/customer-site/src/app/(storefront)/estoque/page.tsx` |
| Vitrine UI | `storefront-inventory-pagination.tsx`, `inventory-search-params.ts` |
| Painel UI | `vehicle-inventory-pagination.tsx`, `panel-inventory-search-params.ts` |

---

## Painel demo showcase — login partilhado (2026-06-20)

| Item | Detalhe |
| --- | --- |
| Problema | `gestor.demo@autopainel.demo` tinha `profiles.dealership_id` só em `demo`; login em `demo-2.loja…` redirecionava para `/erro/concessionaria` |
| Solução | RPC `bind_showcase_demo_panel_dealership` + gate em `require-dashboard-session.ts` rebinda o perfil ao tenant do host (`demo`, `demo-2`, `demo-3`) |
| Migração | `supabase/migrations/20260620190300_showcase_demo_panel_shared_access.sql` |
| Credenciais | `gestor.demo@autopainel.demo` / `LojaDemo123!` — ver `DEALERSHIP_HOSTS_PROVISIONING.md` |
| Deploy remoto | ✅ `20260620190400` aplicada em produção (2026-06-20) |

---

## Platform Sales Squad v1.1 (2026-06-20)

| Item | Detalhe |
| --- | --- |
| Migração | `20260620190400_platform_sales_squad_v11_jobs.sql` |
| RPCs | `generate_monthly_commission_ledger`, `generate_payout_batch`, `mark_payout_batch_paid`, `provision_attribution_from_signed_contract` |
| Cron | `.github/workflows/platform-sales-cron.yml` (dia 1 + dia 10) |
| Scripts | `npm run platform-sales:cron:monthly`, `platform-sales:cron:payout`, `smoke:demo-showcase` |
| Lead won | Sheet em `/painel/leads-comerciais` (`platform-commercial-lead-attribution-sheet.tsx`) |
| Contrato assinado | Rep + loja no formulário → vínculo automático (`platform-contract-detail-actions.tsx`) |

---

| Destino | Guia |
| --- | --- |
| Supabase (migrações + Edge) | `SUPABASE_DEPLOY.md` |
| Vercel (4 apps) | `VERCEL_DEPLOY.md` |
| Env Vercel | `npm run vercel:env:configure` |

Projetos Vercel:

- `auto-painel-marketing-site` (ou nome equivalente)
- `auto-painel-admin-master`
- `auto-painel-dealership-panel`
- `auto-painel-customer-site`

Após alterar `NEXT_PUBLIC_*`: **redeploy** obrigatório.

---

## Testes

```bash
npm run test:e2e        # Playwright — apps dev ligados
npm run test:e2e:ui     # Modo UI
npm run meta:config:smoke
```

Matriz QA integrações: seções em `historico-tecnico.md` (Fase 8 CRM, Meta, classificados).

---

## Security Advisor — hardening Supabase (2026-06-21)

| Item | Ação | Migração / operação |
| --- | --- | --- |
| Bucket `social-carousel-artifacts` | Removida policy `social_carousel_artifacts_public_read` (listagem de objetos); leitura continua por URL pública direta | `20260621103000_security_advisor_hardening_v2.sql` |
| RPCs sales / painel / health | `REVOKE EXECUTE FROM anon` em funções internas (`approve_sales_commission_ledger_entries`, `generate_*`, `mark_payout_batch_paid`, `list_dealership_employees_for_panel`, etc.) | mesma migração |
| Trigger `enforce_internal_dealership_protection` | Revogado EXECUTE REST (`anon`/`authenticated`) — só dispara via trigger em `dealerships` | mesma migração |
| `record_platform_health_ping` | Apenas `service_role` (edge `platform-health-ping` + cron) | mesma migração |
| RPCs vitrine/marketing públicas | **Mantidas** `anon` + `SECURITY DEFINER` (`get_public_vehicle_by_slug`, `list_public_vehicles_filtered`, `create_public_storefront_lead`, …) — vitrine depende delas; advisor pode continuar alertando até migração futura INVOKER+RLS | documentado como exceção aceita |
| Auth leaked passwords | Habilitar **Leaked password protection** (HaveIBeenPwned) em Dashboard → Authentication → Providers → Email | operação manual |

| Share vitrine Facebook | Desktop: popup `facebook.com/sharer`; iOS/Android: `navigator.share` (só `url` no iOS — evita universal link do app FB sem composer); fallback copiar link. OG PNG 1200×630 em `/veiculo/[slug]/opengraph-image` | `vehicle-share-section.tsx`, `build-share-url-with-utm.ts`, `opengraph-image.tsx`, `build-vehicle-page-metadata.ts` |
| CRM contatos — enriquecimento | Painel `/painel/contatos`: editar perfil; **múltiplos veículos de interesse** (`lead_vehicle_interests`, só `available`); venda concretizada → recibo. RPC `update_dealership_lead_profile` | `lead-profile-section.tsx`, `20260621140000_lead_vehicle_interests.sql` |
| Contrato SaaS assinatura v2 | Modelo completo LGPD + boleto + desativação 3 dias — revisão OAB obrigatória | `packages/shared/docs/CONTRATO_SAAS_ASSINATURA_PLATAFORMA.md` |

---

## Épicos 3 e 4 — fechamento (2026-06-21)

**Status:** ✅ **Fechados (base técnica)** — ver `packages/shared/docs/EPICS_CLOSURE_JUN2026.md`

**Verificação:** `npm run verify:epics-closure` · `npm run verify:epics-closure -- --e2e`

### Épico 3 — produção multitenant (go-live)

| Entrega | Artefato |
| --- | --- |
| Smoke Onda A | `npm run smoke:production-go-live` — **11/11 OK** (2026-06-21) |
| E2E login demo prod | `E2E_PRODUCTION=true` — **1/1 OK** (2026-06-21) |
| Redirect www → apex | `apps/marketing-site/next.config.ts` (DNS www Cloudflare pendente) |
| Checklist operacional | `PRODUCTION_MULTITENANT_CHECKLIST.md`, `PRODUCTION_GO_LIVE_WAVE_A.md` |

**Pendente operacional:** 1ª loja cliente real + contrato v2 assinado + boleto; Auth Redirect URLs após novos domínios.

### Épico 4 — operação admin (polish)

| Entrega | Artefato |
| --- | --- |
| EmptyState em listagens | entregue jun/2026 |
| Performance listagens lojas | `fetchDealershipsForAdminList()` |

### Épico 5 — QA onda produção

Smoke + E2E produção OK. Regressão E2E local completa opcional com `dev:all` + seed.

### Contrato assinatura loja (jurídico)

| Entrega | Path |
| --- | --- |
| Modelo v2 (OAB) | `packages/shared/docs/CONTRATO_SAAS_ASSINATURA_PLATAFORMA.md` |
| Template admin DB | migração `20260621150000_platform_contract_template_v2.sql` + `20260623103000_platform_contract_template_names_trial.sql` — trial-adhesion vs saas-acquisition comercial |
| Erros sistêmicos | `@autopainel/shared/components/system/app-system-status-page` — `not-found.tsx` + `error.tsx` nos 4 apps |
| Loja não encontrada | `@autopainel/shared/components/system/store-not-found-page` — `/erro/concessionaria` (painel + vitrine); CTA `autopainel.com.br`; sem checklist dev na UI |

### Campanha trial Essencial (jun/2026)

| Item | Detalhe |
| --- | --- |
| Migração | `20260622120000_trial_campaign_pricing_and_onboarding.sql` — pivots plano + `dealership_onboarding_intakes` + bucket storage |
| RPC | `submit_dealership_onboarding_intake`, `link_dealership_onboarding_intake_to_prospect` |
| Marketing | `/adesao-trial`, `/termo-adesao-trial`, `plans-catalog.ts`, `plans-module-table.tsx` («Em breve») |
| Admin | `/painel/adesoes-trial`, prefill `concessionarias/nova?intake=` |
| Shared | `dealership-onboarding-intake.ts`, `map-onboarding-intake-to-form.ts` |
| Vitrine | `storefront-home-layout.tsx` — trust/finance/heritage em layouts 1–3 |
| Legal vitrine | `STOREFRONT_LEGAL_VERSION=2026-06-22`; operadora/detentora LGPD |
| Termo trial | `packages/shared/docs/TERMO_ADESAO_TRIAL_PLATAFORMA.md` |
| Microcopy Fase 2 | `packages/shared/docs/TRIAL_ONBOARDING_UX_COPY.md` |
| UX Fase 3 | `packages/shared/docs/TRIAL_CAMPAIGN_UX_DESIGN.md` |
| Arquitetura Fase 4 | `packages/shared/docs/TRIAL_CAMPAIGN_ARCHITECTURE.md` |
| Migração lifecycle | `20260622140000_trial_onboarding_intake_lifecycle_rpcs.sql` |
| RPC lifecycle | `mark_dealership_onboarding_intake_converted`, `archive_dealership_onboarding_intake`, `update_dealership_onboarding_intake_payload`, `get_dealership_onboarding_intake_id_for_prospect` |
| Backend Fase 5 | `validate-onboarding-intake-step.ts`, `onboarding-intake-errors.ts`, `submit-trial-onboarding.ts` (validação + mapeamento RPC/upload + **TRIAL-01/02** Resend), `trial-onboarding-form.tsx` (§3.5 completo, máscaras, `saas_prospect_id`) |
| Frontend Fase 6 | Shared: `Stepper`, `FileUploadField`, `StorefrontLayoutPreview`, `StorefrontLayoutPicker`, `KeyValueRepeater`, `OnboardingIntakeStatusBadge`; marketing wizard com Cards, layout picker visual, sticky footer mobile; admin DRY via shared picker/upload |
| DevOps Fase 7 | `apps/marketing-site/.env.example` (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`); sitemap `/adesao-trial`; GTM `trial_onboarding_submit`; checklist Vercel marketing abaixo |
| QA Fase 8 | `packages/shared/docs/TRIAL_CAMPAIGN_QA.md` — roteiro E2E campanha + matriz tenant |
| GTM cobertura (jun/2026) | Snippet GTM carrega mesmo com `GA4_INTERNAL_TRAFFIC_IPS`; `ap_internal_traffic` no dataLayer — ver `autopainel-google-tag-manager.tsx` |
| Marketing copy (jun/2026) | Home `MarketingCoreOperations` — estoque + contatos como núcleo incluído em todos os planos; FAQ; tagline Profissional alinhada (recibo); `BASE_INCLUDED_FEATURES` revisado |
| Campanha 20 vagas (jun/2026) | `trial-constants.ts` (`TRIAL_LIMITED_SPOTS=20`); `fetch-trial-campaign-availability.ts`; `trial-campaign-copy.ts`; `TrialCampaignNotice`; submit marca `payload.campaign` + `metadata.trial_waitlist`; termo v `2026-06-10` |
| Admin leads | `platform-commercial-leads-table.tsx` — ação «Ver adesão» via `metadata.intake_id`; `adesoes-trial-page-client.tsx` (vincular/arquivar) |
| Actions admin | `apps/admin-master/src/actions/dealership-onboarding-intakes.ts`, `dealerships.ts` (`source_intake_id`, `trialing`) |
| Deploy | `npm run supabase:deploy`; marketing Vercel precisa `SUPABASE_SERVICE_ROLE_KEY` para uploads onboarding |

**Checklist go-live campanha trial (DevOps):**

| Item | Onde |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel projeto `marketing-site` (Production + Preview) |
| `RESEND_API_KEY` | Vercel projeto `marketing-site` — e-mails **TRIAL-01** (vaga imediata) / **TRIAL-02** (fila); ver `EMAIL_COMMUNICATION_REGUA.md` §8 |
| Migrações `20260622120000` + `20260622140000` | Supabase remoto (via `npm run supabase:deploy`) |
| GTM evento `trial_onboarding_submit` | Tag GA4 Event em `ap_custom_event` — ver `GTM_EVENTS.md` |
| Sitemap | `/adesao-trial`, `/termo-adesao-trial` em `apps/marketing-site/src/app/sitemap.ts` |
| Smoke | Enviar `/adesao-trial` com logo; confirmar intake + lead em admin; confirmar e-mail TRIAL-01 ou TRIAL-02 na caixa do representante |

---

## Documentação complementar

| Arquivo | Conteúdo |
| --- | --- |
| `README.md` | Setup raiz |
| `DESIGN_SYSTEM.md` | UI e shadcn |
| `SUPABASE_LOCAL.md` | Docker + CLI |
| `SUPABASE_TYPES.md` | Tipagem RPC |
| `PRD_DYNAMIC_PRICING_PLANS_AND_MODULES.md` | Blueprint planos/módulos |
| `TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md` | Hosts multitenant |
| `historico-tecnico.md` | Log técnico histórico (git) |
| `historico-prds.md` | PRDs históricos (git) |

---

## Atualizar esta documentação

Edite `apps/admin-master/content/internal-docs/documentacao-tecnica.md` via PR. O Admin exibe o arquivo do git automaticamente (somente leitura).

*Última atualização: junho/2026*
