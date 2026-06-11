# Migration repair log (histórico operacional)

Registo de reparações manuais no histórico `supabase_migrations.schema_migrations` quando o remoto diverge do git. **Não substitui** ficheiros em `supabase/migrations/` — apenas documenta decisões já aplicadas.

---

## 20260527013053 — entrada remota sem ficheiro no git

| Campo | Valor |
| --- | --- |
| **Versão** | `20260527013053` |
| **Detectado em** | 2026-06-10 (`npm run supabase:migrations:status`) |
| **Sintoma** | Linha só em **Remote** (não existia `.sql` no repositório); `db push --dry-run` falhava com *Remote migration versions not found in local migrations directory* |
| **Causa provável** | SQL aplicado manualmente no Supabase Dashboard (migração ad-hoc), sem commit no monorepo |
| **Ação aplicada** | `supabase migration repair --status reverted 20260527013053` |
| **Operador** | Deploy local via CLI (projeto `wcgevmvystdhqpzwuyig`) |
| **Schema** | Alterações desse SQL já estavam cobertas por migrações versionadas posteriores (`20260527140000`, etc.); repair apenas alinhou o **histórico**, sem rollback de DDL |

### Comandos de referência

```bash
supabase link --project-ref wcgevmvystdhqpzwuyig --password "$SUPABASE_DB_PASSWORD" --yes
supabase migration repair --status reverted 20260527013053
SUPABASE_DB_PUSH_INCLUDE_ALL=true npm run supabase:deploy
```

### Estado após deploy (2026-06-10)

- **57** migrações no git = **57** no remoto (paridade `Local │ Remote` em todas as linhas)
- Última aplicada: `20260527210000_platform_health_ping.sql`
- Edge Functions publicadas: `provision-dealership-user`, `classifieds-oauth-callback`, `meta-oauth-callback`, `platform-health-ping`

### Regra para evitar recorrência

1. Nunca aplicar DDL só no Dashboard — sempre adicionar ficheiro em `supabase/migrations/` e fazer push via `npm run supabase:deploy` ou CI.
2. Se aplicar SQL de emergência no Dashboard, criar migração equivalente no git **ou** registar repair aqui no mesmo dia.

---

## Template (copiar para novos repairs)

```markdown
## YYYYMMDDHHMMSS — título curto

| Campo | Valor |
| --- | --- |
| **Versão** | |
| **Detectado em** | |
| **Sintoma** | |
| **Causa provável** | |
| **Ação aplicada** | `supabase migration repair --status reverted|applied ...` |
| **Schema** | |
```
