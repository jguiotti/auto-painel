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

## Regra de ouro

**Toda alteração de schema vive em `supabase/migrations/`** — nunca editar só no Dashboard sem espelhar no git. O remoto deve sempre ser consequência do repositório.

## Troubleshooting

| Erro | Ação |
| --- | --- |
| `403` no `migration list` | Verificar `SUPABASE_DB_PASSWORD` e ref do projeto |
| Funções não publicadas | Definir `SUPABASE_ACCESS_TOKEN` |
| `db push` bloqueado | Rodar `npm run supabase:migrations:status -- --dry-run` e revisar diff |
| Local Docker | `npm run supabase:reset` aplica migrações locais; deploy remoto é `supabase:deploy` |

Ver também: `SUPABASE_LOCAL.md`, `SUPABASE_HEALTH_PING.md`, `SUPABASE_EDGE_PROVISION.md`.
