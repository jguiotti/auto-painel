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
- **Não** criar eventos `ap_*` no GA4 com “Criar sem código” — eles vêm do **GTM** via dataLayer.

**Passo a passo completo (operacional):** [`GTM_GA4_SETUP.md`](../../../packages/shared/docs/GTM_GA4_SETUP.md)  
**Catálogo de eventos:** [`GTM_EVENTS.md`](../../../packages/shared/docs/GTM_EVENTS.md)

---

## Deploy

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
