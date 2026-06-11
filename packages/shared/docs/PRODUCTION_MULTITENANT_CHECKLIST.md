# Checklist — produção multitenant (Épico 3)

Operadores DevOps e PM usam esta lista antes de abrir URLs públicas por loja (`{slug}.dominio`).

## DNS e TLS

- [ ] Domínio raiz aponta para o projeto Vercel (ou CDN acordado)
- [ ] Wildcard `*.{NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN}` configurado com certificado TLS válido
- [ ] `custom_domain` por loja testado com host exato (sem wildcard) quando aplicável
- [ ] TTL e propagação verificados (`dig`, `curl -I https://{slug}.dominio`)

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

1. Loja demo `active`: vitrine abre em `https://{slug}.{dominio}`
2. Painel: `https://{slug}.{dominio}/login` → login gestor → `/painel`
3. Loja `suspended`: painel redireciona para `/conta-inativa` ou equivalente
4. Slug inexistente: `/erro/concessionaria` (não 404 genérico)
5. Cookie tenant isolado: loja A não vê estoque da loja B após login

## CI (repositório)

- Workflow `.github/workflows/ci.yml` — `npm run lint` + `npm run build` em PR/push `main`
- Workflow `.github/workflows/supabase-migrations-check.yml` — dry-run migrações
- E2E local/CI: `npm run test:e2e` com servidores dev (ver `e2e/README.md`)

## Workers assíncronos (pós Épico 2)

- [ ] Edge Functions `classifieds-sync-worker` e `social-publish-worker` deployadas
- [ ] Secrets: `CLASSIFIEDS_TOKENS_CRYPTO_SECRET`, `META_TOKENS_CRYPTO_SECRET`
- [x] Cron GitHub Actions `integration-workers-cron.yml` (15 min) — secrets `SUPABASE_URL` + `INTEGRATION_WORKERS_CRON_SECRET` (headers `x-*-worker-key`; ver `npm run github:secrets:workers:manual`)

## Referências

- `packages/shared/docs/TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md`
- `apps/admin-master/content/internal-docs/regras-de-negocio.md` (BZ-TERR-*)
