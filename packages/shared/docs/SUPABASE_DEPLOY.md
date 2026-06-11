# Supabase deploy automatizado

Migrações e Edge Functions versionadas em git são aplicadas ao projeto remoto **sem SQL manual** no Dashboard.

## Fluxo

```
git push main (supabase/migrations ou functions)
        ↓
.github/workflows/supabase-deploy.yml
        ↓
scripts/supabase-deploy.mjs
        ↓
supabase link + db push + functions deploy
```

Em **pull requests** que tocam migrações: workflow `supabase-migrations-check.yml` roda `db push --dry-run` (só pré-visualiza).

## Pré-requisitos

### 1. Secrets no GitHub (Settings → Secrets → Actions)

| Secret | Descrição |
| --- | --- |
| `SUPABASE_PROJECT_REF` | Ref do projeto (ex. `wcgevmvystdhqpzwuyig`) |
| `SUPABASE_DB_PASSWORD` | Senha do Postgres remoto (Database settings) |
| `SUPABASE_ACCESS_TOKEN` | [Personal access token](https://supabase.com/dashboard/account/tokens) — deploy de Edge Functions |
| `SUPABASE_URL` | URL pública (health ping pós-deploy) |
| `SUPABASE_ANON_KEY` | Chave anon (health ping) |

### 2. Variáveis locais (`.env.local` na raiz)

```env
SUPABASE_PROJECT_REF=wcgevmvystdhqpzwuyig
SUPABASE_DB_PASSWORD=<senha-postgres-remoto>
SUPABASE_ACCESS_TOKEN=<token-dashboard>
# Ping no projeto hospedado (quando NEXT_PUBLIC_* apontam para 127.0.0.1)
SUPABASE_URL=https://wcgevmvystdhqpzwuyig.supabase.co
SUPABASE_ANON_KEY=<anon-key-remota>
# Opcional — migrações fora de ordem / repair
# SUPABASE_DB_PUSH_INCLUDE_ALL=true
```

Depois: `npm run sync:env` (só copia vars Supabase dos apps; deploy lê a raiz).

## Comandos npm

| Script | Ação |
| --- | --- |
| `npm run supabase:migrations:status` | Lista migrações local vs remoto |
| `npm run supabase:migrations:status -- --dry-run` | + pré-visualiza `db push` |
| `npm run supabase:deploy` | Aplica migrações + Edge Functions |
| `npm run supabase:deploy -- --dry-run` | Só simula |
| `npm run supabase:ping:remote` | Keep-alive no projeto **hospedado** (`--remote` + `SUPABASE_ANON_KEY`) |

## Manifesto

`supabase/deploy.manifest.json` lista Edge Functions publicadas no deploy:

- `provision-dealership-user`
- `classifieds-oauth-callback`
- `meta-oauth-callback`
- `platform-health-ping`

Nova função: adicionar ao manifest + commit; o workflow publica no próximo push.

## Migrações fora de ordem

Se o CLI pedir `--include-all` (timestamp anterior à última migração remota):

```bash
SUPABASE_DB_PUSH_INCLUDE_ALL=true npm run supabase:deploy
```

Ou dispare o workflow manual **Supabase deploy** com `include_all: true`.

## Histórico de repair (drift remoto)

Quando o remoto tem versões em `schema_migrations` **sem** ficheiro no git (SQL só no Dashboard), use `supabase migration repair` e registe em **`supabase/MIGRATION_REPAIR_LOG.md`**.

Exemplo já aplicado (2026-06-10): `20260527013053` marcada como `reverted` — ver log para comandos e estado pós-deploy (57/57 migrações em paridade).

## Regra de ouro

**Toda alteração de schema vive em `supabase/migrations/`** — nunca editar só no Dashboard sem espelhar no git. O remoto deve sempre ser consequência do repositório.

## Troubleshooting

| Erro | Ação |
| --- | --- |
| `403` no `migration list` | Verificar `SUPABASE_DB_PASSWORD` e ref do projeto |
| Funções não publicadas | Definir `SUPABASE_ACCESS_TOKEN` |
| `db push` bloqueado | Rodar `npm run supabase:migrations:status -- --dry-run` e revisar diff |
| Local Docker | `npm run supabase:reset` aplica migrações locais; deploy remoto é `supabase:deploy` |
| `supabase:ping` → `fetch failed` | URL local sem Docker; use `npm run supabase:ping:remote` com `SUPABASE_ANON_KEY` remota |
| Senha/token no log do deploy | Scripts redigem `--password` e `--token`; ver `packages/shared/docs/SECURITY_SECRETS.md` |
| `supabase:ping:remote` → 401 | Definir `SUPABASE_ANON_KEY` remota em `.env.local` (não a anon do Docker) |

## Segredos e histórico git

- `.env.local` e `apps/*/.env.local` estão no `.gitignore` — nunca commitar.
- Verificar: `npm run env:check-tracked`
- Remover do índice se alguém adicionou por engano: `npm run git:untrack-env`
- Apagar segredos do histórico: `packages/shared/docs/SECURITY_SECRETS.md`

Ver também: `SUPABASE_LOCAL.md`, `SUPABASE_HEALTH_PING.md`, `SUPABASE_EDGE_PROVISION.md`.
