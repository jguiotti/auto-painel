# AutoPainel

Monorepo da plataforma AutoPainel: apps Next.js, pacote compartilhado (`packages/shared`), banco Supabase e automações de deploy/CI.

## Estrutura

```
apps/
  marketing-site/     Site institucional
  admin-master/         Painel interno da plataforma
  dealership-panel/     Painel da concessionária (lojista)
  customer-site/        Vitrine pública da loja
packages/
  shared/               UI (shadcn), utilitários, tipos Supabase, docs técnicas
supabase/
  migrations/           Schema versionado (fonte de verdade)
  functions/            Edge Functions
scripts/                Seeds, deploy Supabase, utilitários de env
e2e/                    Testes Playwright
```

## Pré-requisitos

- **Node.js** 20+ e **npm** 10+ (ver `packageManager` em `package.json`)
- **Docker Desktop** — para Supabase local
- **[Supabase CLI](https://supabase.com/docs/guides/cli)** — `supabase --version`
- **Git** — clone fora de pastas sincronizadas pelo iCloud/Google Drive (evita corrupção do índice `.git`)

## Primeiro setup

```bash
git clone https://github.com/jguiotti/auto-painel.git
cd auto-painel
npm install
```

### Variáveis de ambiente

1. Copie o modelo na raiz do monorepo:

   ```bash
   cp .env.example .env.local
   ```

2. Preencha `.env.local` com as credenciais do seu ambiente (Supabase, URLs locais, etc.). **Nunca commite** `.env.local` — só `.env.example` (sem valores reais) vai para o git.

3. Propague a raiz para cada app:

   ```bash
   npm run sync:env
   ```

4. Verifique se nenhum arquivo de env está versionado:

   ```bash
   npm run env:check-tracked
   ```

Detalhes por variável: comentários em `.env.example`. Segurança e purge de histórico: [`packages/shared/docs/SECURITY_SECRETS.md`](packages/shared/docs/SECURITY_SECRETS.md).

## Desenvolvimento

### Subir todos os apps

```bash
npm run dev:all
```

| App | Pacote npm | Porta local | URL |
| --- | --- | ---: | --- |
| Marketing | `@autopainel/marketing-site` | 3000 | http://localhost:3000 |
| Admin plataforma | `@autopainel/admin-master` | 3001 | http://localhost:3001 |
| Painel lojista | `@autopainel/dealership-panel` | 3002 | http://localhost:3002 |
| Vitrine | `@autopainel/customer-site` | 3003 | http://localhost:3003 |

### Subir apps individualmente

```bash
npm run dev:marketing-site
npm run dev:admin-master
npm run dev:dealership-panel
npm run dev:customer-site
```

Menos carga na máquina (3 apps, concurrency limitada):

```bash
npm run dev:lite
```

Build e lint de todo o monorepo:

```bash
npm run build
npm run lint
npm run format
```

## Supabase

| Comando | Descrição |
| --- | --- |
| `npm run supabase:start` | Sobe Postgres, Auth, Storage e Studio via Docker |
| `npm run supabase:stop` | Para a stack local |
| `npm run supabase:status` | URLs, chaves e saúde (`supabase status -o env` para copiar keys) |
| `npm run supabase:reset` | Recria o banco e reaplica `supabase/migrations/` |
| `npm run supabase:migrations:status` | Compara migrações git vs remoto |
| `npm run supabase:deploy` | Aplica migrações e Edge Functions no projeto remoto |
| `npm run supabase:ping` / `supabase:ping:remote` | Keep-alive da instância |

Guia completo local: [`packages/shared/docs/SUPABASE_LOCAL.md`](packages/shared/docs/SUPABASE_LOCAL.md).  
Deploy remoto e CI: [`packages/shared/docs/SUPABASE_DEPLOY.md`](packages/shared/docs/SUPABASE_DEPLOY.md).

### Dados demo (opcional)

Após `supabase start` ou `supabase db reset`:

```bash
npm run seed:demo-users      # usuários Auth das lojas demo
npm run seed:admin-user      # super-usuário admin (requer config no script/.env)
```

## Testes E2E

Com servidores dev rodando e `.env.local` configurado:

```bash
npx playwright install chromium
npm run test:e2e
```

Ver [`e2e/README.md`](e2e/README.md) para variáveis opcionais e escopo dos testes.

## Design system e UI

Componentes shadcn e tokens ficam **somente** em `packages/shared`. Apps importam via `@autopainel/shared/ui`.

- [`packages/shared/docs/DESIGN_SYSTEM.md`](packages/shared/docs/DESIGN_SYSTEM.md)
- [`packages/shared/docs/SHADCN.md`](packages/shared/docs/SHADCN.md)
- Adicionar componente: `npm run ui:add -- <nome>` a partir de `packages/shared`

## Documentação para o time

| Recurso | Conteúdo |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Visão geral do monorepo, regras Cursor, links principais |
| [`packages/shared/docs/`](packages/shared/docs/) | Contratos técnicos (Supabase, deploy, integrações, GTM) |
| [`rules/`](rules/) | Convenções de código, idioma, workflow de squad |
| `apps/admin-master/content/internal-docs/` | Rastreabilidade operacional (acesso restrito via painel admin) |

**Regras de negócio e PRDs** ficam no admin interno — não duplicar no README.

## Produção e integrações (runbook dev)

Fluxos operacionais **sem segredos** — valores reais só em `.env.local` / Vercel / Supabase Dashboard.

| Objetivo | Comando / doc |
| --- | --- |
| Aplicar migrações + Edge Functions | `npm run supabase:deploy` → [`SUPABASE_DEPLOY.md`](packages/shared/docs/SUPABASE_DEPLOY.md) |
| Secrets integrações (Meta, OLX, workers) | `npm run integration:secrets:configure` → [`INTEGRATIONS_DEPLOY.md`](packages/shared/docs/INTEGRATIONS_DEPLOY.md) |
| Smoke config Meta | `npm run meta:config:smoke` → [`META_INTEGRATION_SIMPLIFIED.md`](packages/shared/docs/META_INTEGRATION_SIMPLIFIED.md) |
| Publicar host de nova loja (Vercel + DNS) | `npm run dealership:hosts:provision -- <slug>` → [`DEALERSHIP_HOSTS_PROVISIONING.md`](packages/shared/docs/DEALERSHIP_HOSTS_PROVISIONING.md) |
| Deploy apps Vercel + env | [`VERCEL_DEPLOY.md`](packages/shared/docs/VERCEL_DEPLOY.md), `npm run vercel:env:configure` |
| Sync env local → apps | `npm run sync:env` |
| Demo users (local/remoto) | `npm run seed:demo-users` |
| GTM / GA4 eventos | [`GTM.md`](packages/shared/docs/GTM.md), [`GTM_EVENTS.md`](packages/shared/docs/GTM_EVENTS.md) |

### Mapa de URLs produção

| Superfície | Padrão |
| --- | --- |
| Marketing | `https://autopainel.com.br` |
| Admin | `https://admin.autopainel.com.br` |
| Vitrine loja | `https://{slug}.autopainel.com.br` |
| Painel loja | `https://{slug}.loja.autopainel.com.br` |

Cada slug novo exige **Supabase** (concessionária) + **Vercel** (hostnames) + **DNS** (CNAME ou Cloudflare wildcard).

## Utilitários npm

| Script | Uso |
| --- | --- |
| `npm run sync:env` | Copia `.env.local` da raiz para `apps/*/` |
| `npm run env:check-tracked` | Falha se `.env.local` estiver no git |
| `npm run git:untrack-env` | Remove env files do índice git |
| `npm run git:repair-index` | Repara `.git/index` corrompido ou com timeout |
| `npm run clean:caches` | Limpa caches Next/Turbo locais |
| `npm run dealership:hosts:provision` | Regista slug na Vercel + instruções DNS |
| `npm run meta:config:smoke` | Valida env Meta local/remoto |
| `npm run integration:secrets:configure` | Propaga secrets para Edge Functions |

## Contribuição

1. Branch a partir de `main`
2. Migrações SQL novas em `supabase/migrations/` (timestamp UTC)
3. Tipos compartilhados em `packages/shared/src/types` quando alterar RPCs/contratos
4. Não commitar segredos — rodar `npm run env:check-tracked` antes do push
