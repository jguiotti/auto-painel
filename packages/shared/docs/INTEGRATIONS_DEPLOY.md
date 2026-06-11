# Integrações (Meta + classificados) — deploy e secrets

Checklist DevOps para colocar em produção o hub **Integrações facilitadas** (Épico 2 UX), workers assíncronos e render de carrossel.

**Projeto Supabase:** `wcgevmvystdhqpzwuyig`  
**App Vercel crítico:** `dealership-panel` (render Sharp + OAuth start + preview)

---

## 1. Ordem de deploy (obrigatória)

```
1. Commit no git (migração + código + Edge Functions)
2. Aplicar migração remota (db push ou SQL manual)
3. Deploy Edge Functions (meta-oauth-callback atualizado + workers)
4. Configurar secrets Supabase Edge
5. Configurar env Vercel dealership-panel
6. Configurar secrets GitHub Actions (cron workers)
7. Redeploy dealership-panel
8. Smoke test (Integrações → preview carrossel → enqueue job)
```

Não publique o painel **antes** da migração `20260610160000` — RPCs `upsert_dealership_social_carousel_settings` e coluna `page_selection_required` são necessários.

---

## 2. Migração pendente

| Ficheiro | Estado remoto (verificar com `npm run supabase:migrations:status`) |
| --- | --- |
| `20260610160000_integrations_ux_facilitated.sql` | **Pendente** até `db push` |

Conteúdo principal:

- Tabela `dealership_social_carousel_settings`
- Status Meta `page_selection_required` + `pending_page_candidates`
- Colunas `external_listing_url`, `published_at`, `trigger_source`
- RPCs: `upsert_dealership_social_carousel_settings`, `list_dealership_meta_page_candidates`, `dismiss_integrations_onboarding`

### Aplicar (escolha uma)

**CLI (recomendado após review):**

```bash
npm run supabase:migrations:status -- --dry-run   # confirma diff
npm run supabase:deploy                            # migrações + Edge Functions do manifest
```

**SQL manual:** copiar conteúdo de `supabase/migrations/20260610160000_integrations_ux_facilitated.sql` no Dashboard → SQL Editor.

### Checklist migração

- [ ] Testada localmente (`npm run supabase:reset` ou stack local)
- [ ] Apenas aditiva (sem `DROP TABLE` em dados live)
- [ ] RLS em `dealership_social_carousel_settings` verificado no ficheiro
- [ ] Ficheiro commitado em `supabase/migrations/` antes do remoto
- [ ] `npm run supabase:migrations:status` mostra paridade após push

---

## 3. Edge Functions (Supabase)

Manifesto: `supabase/deploy.manifest.json`

| Função | Quando redeployar |
| --- | --- |
| `meta-oauth-callback` | **Obrigatório** — fluxo multi-página (`page_selection_required`) |
| `social-publish-worker` | Após alterações em `social-publish-process-job.ts` |
| `classifieds-sync-worker` | Após `external_listing_url` no adapter |
| `classifieds-oauth-callback` | Se credenciais OLX/WM mudarem |

```bash
# Deploy completo (migrações + funções do manifest)
npm run supabase:deploy

# Ou só uma função
supabase functions deploy meta-oauth-callback --project-ref wcgevmvystdhqpzwuyig
```

---

## 4. Secrets — Supabase Edge

Definir via Dashboard → Edge Functions → Secrets, ou CLI:

```bash
npm run integration:secrets:configure          # lê .env.local
npm run integration:secrets:configure -- --manual # imprime valores para colar
```

| Secret Edge | Obrigatório | Descrição |
| --- | --- | --- |
| `META_TOKENS_CRYPTO_SECRET` | Sim | Cifra tokens Meta em repouso |
| `META_APP_CLIENT_ID` | Sim (prod) | App Meta da AutoPainel |
| `META_APP_CLIENT_SECRET` | Sim (prod) | App Meta da AutoPainel |
| `META_PLATFORM_APP_ONLY` | Sim (prod) | `true` — Connect simplificado |
| `META_OAUTH_REDIRECT_URI` | Recomendado | `https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/meta-oauth-callback` |
| `SOCIAL_CAROUSEL_RENDER_URL` | Sim (carrossel real) | URL pública do Route Handler Next (ver §5) |
| `SOCIAL_CAROUSEL_RENDER_SECRET` | Sim | Partilhado com Vercel `dealership-panel` |
| `SOCIAL_PUBLISH_WORKER_SECRET` | Sim | Mesmo valor que cron GitHub / header `x-social-worker-key` |
| `CLASSIFIEDS_SYNC_WORKER_SECRET` | Sim | Mesmo valor que cron / header `x-classifieds-worker-key` |
| `CLASSIFIEDS_TOKENS_CRYPTO_SECRET` | Sim (classificados) | Cifra tokens OLX/WM |
| `SOCIAL_PUBLISH_DRY_RUN` | Até homologação | `true` (padrão seguro) ou `false` para Graph API real |
| `CLASSIFIEDS_SYNC_DRY_RUN` | Até homologação | `true` sem APIs reais dos portais |
| `OLX_*` / `WEBMOTORS_*` | Quando homologar | OAuth + URLs de API dos portais |

Workers cron: `npm run github:secrets:workers` ou `npm run github:secrets:workers:manual`

---

## 5. Variáveis — Vercel `dealership-panel`

**Production + Preview + Development** (onde aplicável):

| Variável | `NEXT_PUBLIC_`? | Obrigatório | Notas |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | Sim | URL do projeto hospedado |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Sim | Chave anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Não | Sim | Render carrossel + finalize Meta page |
| `META_TOKENS_CRYPTO_SECRET` | Não | Sim | Mesmo valor que Edge |
| `META_APP_CLIENT_ID` | Não | Prod | App Meta plataforma |
| `META_APP_CLIENT_SECRET` | Não | Prod | App Meta plataforma |
| `META_PLATFORM_APP_ONLY` | Não | Prod | `true` |
| `SOCIAL_CAROUSEL_RENDER_SECRET` | Não | Sim | Igual ao secret Edge |
| `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` | Sim | Sim | Ex. `autopainel.com.br` |
| `NEXT_PUBLIC_DEALERSHIP_AUTH_REDIRECT_ORIGIN` | Sim | Sim | Redirect Auth Supabase |

**Derivar URL de render para Edge:**

```
SOCIAL_CAROUSEL_RENDER_URL = {DEALERSHIP_PANEL_PUBLIC_URL}/api/internal/social-carousel-render
```

Exemplo produção:

```
DEALERSHIP_PANEL_PUBLIC_URL=https://painel.autopainel.com.br
SOCIAL_CAROUSEL_RENDER_URL=https://painel.autopainel.com.br/api/internal/social-carousel-render
```

Em dev local (worker remoto a apontar para máquina — só debug):

```
SOCIAL_CAROUSEL_RENDER_URL=http://127.0.0.1:3002/api/internal/social-carousel-render
```

> O **preview** na ficha do veículo chama Sharp diretamente no servidor Next (`previewVehicleCarouselAction`) — não depende de `SOCIAL_CAROUSEL_RENDER_URL`. A URL Edge só é necessária para jobs do `social-publish-worker`.

---

## 6. GitHub Actions

| Workflow | Secrets |
| --- | --- |
| `integration-workers-cron.yml` | `SUPABASE_URL`, `INTEGRATION_WORKERS_CRON_SECRET` |
| `supabase-deploy.yml` | `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN`, … |

Configurar workers:

```bash
npm run github:secrets:workers:manual
```

Validar: Actions → **Integration workers cron** → Run workflow → HTTP 200 nos dois workers.

---

## 7. Meta (Facebook Developers)

Checklist App Review (uma vez, plataforma):

- [ ] Redirect URI: `https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/meta-oauth-callback`
- [ ] Permissões: `pages_show_list`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`, `business_management`
- [ ] App em modo Live após revisão
- [ ] `SOCIAL_PUBLISH_DRY_RUN=false` na Edge quando validar publicação real

---

## 8. Smoke test pós-deploy

| # | Passo | Resultado esperado |
| --- | --- | --- |
| 1 | `/painel/integracoes` com módulo Enterprise | Banner onboarding + 3 blocos |
| 2 | Conectar Meta (conta teste) | Wizard 3 passos; popup fecha |
| 3 | Multi-página | Diálogo «Qual página usar?» → Conectado |
| 4 | Salvar aparência carrossel | Toast sucesso; RPC persiste |
| 5 | Ficha veículo → Ver preview | Modal com slides (capa + fotos + CTA) |
| 6 | Compartilhar agora | Job `queued` → worker → `published` (ou dry_run) |
| 7 | Cron manual | `integration-workers-cron` verde |
| 8 | Classificados toggles | Só portais conectados enfileiram |

---

## 9. Rollback

| Componente | Ação |
| --- | --- |
| Painel Vercel | Redeploy commit anterior |
| Edge Functions | `supabase functions deploy <name>` versão anterior do git |
| Migração SQL | **Não reverter** em produção sem script down dedicado; colunas novas são opcionais para código antigo |
| `SOCIAL_PUBLISH_DRY_RUN` | Voltar `true` para parar publicações reais Meta |

---

## Referências

- `packages/shared/docs/SUPABASE_DEPLOY.md`
- `packages/shared/docs/SOCIAL_CAROUSEL_RENDER.md`
- `packages/shared/docs/META_INTEGRATION_SIMPLIFIED.md`
- `packages/shared/docs/PRODUCTION_MULTITENANT_CHECKLIST.md`
- `apps/admin-master/content/internal-docs/documentacao-tecnica.md` (Épico 2 UX)
