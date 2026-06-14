# Supabase local (Docker)

Guia para subir Postgres + Auth + Storage + Studio via **Supabase CLI** neste monorepo.

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) em execução
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado (`supabase --version`)

## Comandos (raiz do repo)

| Script npm | Equivalente CLI | Uso |
| --- | --- | --- |
| `npm run supabase:start` | `supabase start` | Sobe todos os containers |
| `npm run supabase:stop` | `supabase stop` | Para a stack local |
| `npm run supabase:status` | `supabase status` | URLs, chaves e saúde |
| `npm run supabase:reset` | `supabase db reset` | Recria o banco e reaplica `supabase/migrations/` |
| `npm run supabase:deploy` | script + CI | Aplica migrações e Edge Functions no projeto **remoto** linkado |
| `npm run supabase:migrations:status` | script | Compara migrações git vs remoto (`--dry-run` para pré-visualizar push) |

Deploy remoto: **`packages/shared/docs/SUPABASE_DEPLOY.md`** (secrets GitHub + `.env.local` com `SUPABASE_PROJECT_REF` / `SUPABASE_DB_PASSWORD`).

## Portas padrão

| Serviço | URL |
| --- | --- |
| API (REST / Auth / Functions) | http://127.0.0.1:54321 |
| Postgres | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Studio | http://127.0.0.1:54323 |
| Mailpit (e-mail de teste) | http://127.0.0.1:54324 |

## Variáveis para `.env.local`

Com a stack ligada, obtenha as chaves:

```bash
supabase status -o env
```

Para apontar os apps Next.js ao Supabase **local**, use na raiz `.env.local` (depois `npm run sync:env`):

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY de supabase status -o env>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY de supabase status -o env>
```

Mantenha uma cópia separada das credenciais do projeto **remoto** (`wcgevmvystdhqpzwuyig`) se alternar entre local e hosted — não commite segredos.

## Dados demo

Após `supabase start` ou `supabase db reset`, a migração `20260514120000_seed_demo_dealerships_e2e.sql` cria lojas demo (Guiotti, AutoPrime, etc.).

Usuários Auth demo (script existente):

```bash
npm run seed:demo-users
```

Requer `SUPABASE_SERVICE_ROLE_KEY` da instância ativa (local ou remota). Também atribui os leads demo da Guiotti ao gestor e cria `lead_notes` (migração `20260614200000_seed_demo_crm_leads.sql`).

**Funil CRM demo (Guiotti):** após reset + seed, abra `http://guiotti.localhost:3002/painel/contatos` — 6 contatos cobrindo status `new`, `contacted`, `hot`, `won`, `lost` (fontes vitrine + manual + simulação).

## Edge Functions locais

Funções em `supabase/functions/` ficam disponíveis em:

`http://127.0.0.1:54321/functions/v1/<nome>`

Secrets locais: `supabase secrets set --env-file supabase/.env` (não versionar).

**OAuth classificados (dev):** com `CLASSIFIEDS_OAUTH_DEV_STUB=true` e `CLASSIFIEDS_TOKENS_CRYPTO_SECRET` na raiz `.env.local`, rode `npm run sync:env` e `npm run classifieds:oauth:dev:configure`. O fluxo simula login OLX/WebMotors/iCarros em `/api/painel/integracoes/oauth/dev/*` (sem credenciais reais dos portais). Use `CLASSIFIEDS_SYNC_DRY_RUN=true` para publicação simulada na ficha do veículo.

## Troubleshooting

- **`PGRST301` / `/erro/concessionaria` com `{slug}.localhost`:** confira se `NEXT_PUBLIC_SUPABASE_URL` aponta para `http://127.0.0.1:54321` **e** se `NEXT_PUBLIC_SUPABASE_ANON_KEY` é a chave **local** (`supabase status -o env`), não a do projeto remoto. Variáveis exportadas no shell (`echo $NEXT_PUBLIC_SUPABASE_ANON_KEY`) têm prioridade sobre `.env.local`; o `scripts/inject-monorepo-env.cjs` força a raiz `.env.local` nos apps Next. Se persistir, rode `unset NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_ANON_KEY` e reinicie `npm run dev:dealership-panel`.
- **Docker não conecta:** abra o Docker Desktop e aguarde ficar *Running*.
- **`supabase db pull` / shadow DB:** exige Docker + `supabase start` (shadow na porta `54320`).
- **Health check do storage na 1ª subida:** rode `supabase start` de novo; migrações já aplicadas, containers sobem mais rápido.
- **Versões de imagem vs remoto:** aviso do CLI sobre `storage-api` — opcional `supabase link` + atualizar CLI; não bloqueia dev local.
- **Reset completo:** `supabase stop --no-backup` e depois `supabase start`.
- **Contatos/Equipe com erro de coluna ou RPC (`client_email does not exist`, `list_dealership_employees_for_panel` no schema cache):** o Postgres local ficou **fora de paridade** com `supabase/migrations/` (histórico marcado como aplicado sem DDL). Corrija com:
  ```bash
  npm run supabase:reset
  npm run seed:demo-users
  ```
  Depois faça login de novo no painel (`gestor.guiotti@autopainel.demo` / `LojaDemo123!` se usar seed demo). Confirme `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`.

## Remoto vs local

| Cenário | Recomendação |
| --- | --- |
| **Editar dados reais da loja (logo, contato, estoque)** | `.env.local` → projeto **remoto** (`NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co` + chaves do Dashboard ou `supabase projects api-keys`) |
| **Testar migrações / CRM demo / offline** | `.env.local` → **local** (`127.0.0.1:54321`) + `supabase db reset` |
| **Local com dados iguais à produção (uma loja)** | Após reset local: `npm run sync:dealership-from-remote -- guiotti` |

**Importante:** `supabase db reset` **apaga** o Postgres local e reaplica migrações — nunca afeta o remoto. O slug `guiotti` existe na produção **e** no seed demo; migrações de seed usam `ON CONFLICT DO NOTHING` para não sobrescrever lojas já cadastradas no remoto.

**Admin master (`super_admin`):** credenciais via env (não commitar senha):

```bash
SUPER_ADMIN_EMAIL=seu@email.com SUPER_ADMIN_PASSWORD='...' \
  NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=<service_role remoto> \
  npm run provision:super-admin
```

Depois do login, troque a senha em `/painel/conta/senha`.

**Login local (admin + painel):** usuários Auth **não** são copiados do remoto no `db reset`. Para o mesmo e-mail no Docker local:

```bash
SUPER_ADMIN_EMAIL=seu@email.com SUPER_ADMIN_PASSWORD='...' \
  NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
  SUPABASE_SERVICE_ROLE_KEY=<local service_role> \
  npm run provision:super-admin
```

Painel da loja demo: `npm run seed:demo-users` (`gestor.guiotti@autopainel.demo` / `LojaDemo123!`).

Projeto linkado: **AutoPainel** (`wcgevmvystdhqpzwuyig`, São Paulo).

## Primeira carga lenta no `next dev` (monorepo)

Tailwind v4 + `@autopainel/shared` faz a **primeira compilação** de cada app levar **~1–2 minutos**. O navegador fica em branco/carregando — não é loop infinito nem erro de Supabase.

1. Suba `npm run dev:all` e aguarde todos mostrarem `Ready`.
2. Em **outro terminal**, rode `npm run dev:warm` (aquece rotas principais).
3. Só então abra no browser; recargas seguintes levam segundos.

Se uma porta falhar com `EADDRINUSE`, mate processos `next dev` antigos antes de subir de novo.

Os avisos `runtime.lastError` / `multi-tabs.js` no console vêm de **extensões do Chrome**, não do AutoPainel.
