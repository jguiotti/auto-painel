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

## 20260611172939 / 20260611173013 — MCP apply com timestamp divergente do git

| Campo | Valor |
| --- | --- |
| **Versões remoto** | `20260611172939` (`classifieds_modules_by_provider`), `20260611173013` (`classifieds_enqueue_module_gate`) |
| **Detectado em** | 2026-06-11 (`npm run supabase:deploy` após apply via MCP Cursor) |
| **Sintoma** | `db push` falhou: *Remote migration versions not found in local migrations directory*; ficheiros locais tinham `20260611190000` / `20260611200000` |
| **Causa** | SQL aplicado no remoto via MCP `apply_migration` (timestamps auto), enquanto o git tinha nomes diferentes |
| **Ação aplicada** | Renomear ficheiros locais para `20260611172939_*` e `20260611173013_*` (paridade com `schema_migrations` remoto; **sem** reexecutar DDL) |
| **Schema** | Três módulos (`olx_sync`, `webmotors_sync`, `icarros_sync`) no catálogo; `classifieds_sync` removido; enterprise/trial com pivôs |

### Regra

Preferir **sempre** `npm run supabase:deploy` ou commit em `supabase/migrations/` — evitar `apply_migration` MCP com timestamp que não existe no git.

---

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
