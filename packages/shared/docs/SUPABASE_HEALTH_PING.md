# Supabase keep-alive (health ping)

Projetos **hosted** no plano gratuito do Supabase entram em pausa após ~7 dias sem tráfego na API. Este repositório inclui um ping diário leve para manter o projeto ativo.

## Componentes

| Artefato | Função |
| --- | --- |
| RPC `platform_health_ping()` | `SELECT now()` encapsulado — seguro para `anon` |
| RPC `record_platform_health_ping(...)` | Auditoria em `platform_health_ping_log` (só `service_role`) |
| Edge Function `platform-health-ping` | Ping completo + grava log (opcional) |
| `scripts/ping-supabase-health.mjs` | Script local / CI |
| `.github/workflows/supabase-health-ping.yml` | Cron diário (08:00 UTC) |

Migração: `supabase/migrations/20260527210000_platform_health_ping.sql`

## 1. Aplicar migração

No Dashboard SQL ou `supabase db push` (quando o time usar CLI no remoto).

## 2. Deploy da Edge Function (opcional)

```bash
supabase secrets set PLATFORM_HEALTH_PING_SECRET=<string-longa-aleatoria>
supabase functions deploy platform-health-ping --no-verify-jwt
```

`PLATFORM_HEALTH_PING_SECRET` é opcional: se definido, exige header `x-health-ping-key` na função.

## 3. Ping manual (desenvolvimento)

Com `.env.local` na raiz apontando ao projeto (local ou remoto):

```bash
npm run supabase:ping
```

Modo edge (após deploy da função):

```bash
SUPABASE_PING_MODE=edge npm run supabase:ping
```

## 4. GitHub Actions (produção recomendada)

No repositório GitHub → **Settings → Secrets and variables → Actions**:

| Secret | Valor |
| --- | --- |
| `SUPABASE_URL` | URL do projeto (ex. `https://xxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Chave anon/publicável |

O workflow `supabase-health-ping.yml` roda **todo dia** e chama o RPC via anon key.

Disparo manual: **Actions → Supabase health ping → Run workflow**.

## 5. Alternativas (sem GitHub)

- **cron-job.org** / **n8n** / **Uptime Robot**: `POST {SUPABASE_URL}/rest/v1/rpc/platform_health_ping` com headers `apikey` + `Authorization: Bearer {ANON_KEY}` e body `{}`.
- Frequência sugerida: **1× por dia** (suficiente para evitar pausa).

## 6. Stack local (Docker)

O ping também funciona contra `http://127.0.0.1:54321` — útil para validar o script; **não** substitui `supabase start` para manter containers Docker ligados.

## 7. Verificar auditoria (operadores)

```sql
select source, ok, latency_ms, created_at
from public.platform_health_ping_log
order by created_at desc
limit 20;
```

Somente `super_admin` lê a tabela via RLS.
