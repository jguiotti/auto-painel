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

Configuração versionada: **`supabase/config.toml`** (portas, redirects Auth para dev multi-loja).

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

Requer `SUPABASE_SERVICE_ROLE_KEY` da instância ativa (local ou remota).

## Edge Functions locais

Funções em `supabase/functions/` ficam disponíveis em:

`http://127.0.0.1:54321/functions/v1/<nome>`

Secrets locais: `supabase secrets set --env-file supabase/.env` (não versionar).

## Troubleshooting

- **Docker não conecta:** abra o Docker Desktop e aguarde ficar *Running*.
- **`supabase db pull` / shadow DB:** exige Docker + `supabase start` (shadow na porta `54320`).
- **Health check do storage na 1ª subida:** rode `supabase start` de novo; migrações já aplicadas, containers sobem mais rápido.
- **Versões de imagem vs remoto:** aviso do CLI sobre `storage-api` — opcional `supabase link` + atualizar CLI; não bloqueia dev local.
- **Reset completo:** `supabase stop --no-backup` e depois `supabase start`.

## Remoto vs local

| Cenário | Recomendação |
| --- | --- |
| Dev diário com dados reais/demo hosted | `.env.local` → projeto remoto |
| Migrações, `db pull`, testes offline | `.env.local` → local + `supabase db reset` |
| CI / E2E | Remoto ou local conforme pipeline |

Projeto linkado: **AutoPainel** (`wcgevmvystdhqpzwuyig`, São Paulo).

## Primeira carga lenta no `next dev` (monorepo)

Tailwind v4 + `@autopainel/shared` faz a **primeira compilação** de cada app levar **~1–2 minutos**. O navegador fica em branco/carregando — não é loop infinito nem erro de Supabase.

1. Suba `npm run dev:all` e aguarde todos mostrarem `Ready`.
2. Em **outro terminal**, rode `npm run dev:warm` (aquece rotas principais).
3. Só então abra no browser; recargas seguintes levam segundos.

Se uma porta falhar com `EADDRINUSE`, mate processos `next dev` antigos antes de subir de novo.

Os avisos `runtime.lastError` / `multi-tabs.js` no console vêm de **extensões do Chrome**, não do AutoPainel.
