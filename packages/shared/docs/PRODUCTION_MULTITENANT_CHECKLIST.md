# Checklist — produção multitenant (Épico 3)

Operadores DevOps e PM usam esta lista antes de abrir URLs públicas por loja (`{slug}.dominio`).

## DNS e TLS

- [x] Domínio raiz aponta para o projeto Vercel (autopainel.com.br → `auto-painel-site`)
- [x] Wildcard `*.autopainel.com.br` e `*.loja.autopainel.com.br` (Cloudflare NS)
- [x] Smoke vitrine/painel demo showcase — `npm run smoke:demo-showcase` (2026-06-20)
- [x] Smoke Onda A go-live — `npm run smoke:production-go-live` (2026-06-21: 11/11 hard)
- [x] E2E login demo produção — `E2E_PRODUCTION=true npm run test:e2e -- e2e/specs/production-go-live.spec.ts` (2026-06-21: 1/1)
- [ ] `www.autopainel.com.br` — CNAME/redirect na Cloudflare (código Next OK; smoke WARN)
- [ ] `custom_domain` por loja testado com host exato (sem wildcard) quando aplicável
- [ ] TTL e propagação verificados (`dig`, `curl -I https://{slug}.dominio`) por loja cliente real

## Variáveis de ambiente (Vercel — todos os apps tenant)

| Variável | Valor produção |
| --- | --- |
| `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` | Domínio raiz sem subdomínio (ex.: `autopainel.com.br`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon/publicável |

**Não** definir `NEXT_PUBLIC_DEVELOPMENT_TENANT_SLUG` em produção.

## Supabase Auth — Redirect URLs

Incluir padrões para cada app que recebe login:

```
https://{slug}.{dominio}/**
https://*.{dominio}/**
```

Apps afetados: `dealership-panel` (login/recuperar senha), `customer-site` se usar auth no futuro.

Após alterar domínio raiz, **revalidar** todos os redirect URLs — login quebra silenciosamente se faltar entrada.

## Smoke manual (CA-TOJ-010)

1. Loja demo `active`: vitrine abre em `https://{slug}.{dominio}` — **OK** demo/demo-2/demo-3 (2026-06-20)
2. Painel: `https://{slug}.loja…/login` → login `gestor.demo@autopainel.demo` → `/painel` — **automático** via `production-go-live.spec.ts` com `E2E_PRODUCTION=true`; validar manualmente após mudanças de Auth
3. Loja `suspended`: painel redireciona para `/conta-inativa` ou equivalente
4. Slug inexistente: `/erro/concessionaria` (não 404 genérico)
5. Cookie tenant isolado: loja A não vê estoque da loja B após login

## CI (repositório)

- Workflow `.github/workflows/ci.yml` — `npm run lint` + `npm run build` em PR/push `main`
- Workflow `.github/workflows/supabase-migrations-check.yml` — dry-run migrações
- E2E local/CI: `npm run test:e2e` com servidores dev (ver `e2e/README.md`)

## Workers assíncronos (pós Épico 2)

- [ ] Migração `20260610160000_integrations_ux_facilitated.sql` aplicada no remoto
- [ ] Edge Functions deployadas (`meta-oauth-callback`, `classifieds-sync-worker`, `social-publish-worker`)
- [ ] Secrets Edge: `META_TOKENS_CRYPTO_SECRET`, `CLASSIFIEDS_TOKENS_CRYPTO_SECRET`, `SOCIAL_CAROUSEL_RENDER_URL`, `SOCIAL_CAROUSEL_RENDER_SECRET`
- [ ] Vercel `dealership-panel`: `META_PLATFORM_APP_ONLY=true`, `SOCIAL_CAROUSEL_RENDER_SECRET`, `META_TOKENS_CRYPTO_SECRET`
- [x] Cron GitHub Actions `integration-workers-cron.yml` (15 min) — `npm run github:secrets:workers:manual`
- [ ] Smoke: preview carrossel + enqueue job — ver `packages/shared/docs/INTEGRATIONS_DEPLOY.md` §8

## Referências

- `packages/shared/docs/TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md`
- `apps/admin-master/content/internal-docs/regras-de-negocio.md` (BZ-TERR-*)
