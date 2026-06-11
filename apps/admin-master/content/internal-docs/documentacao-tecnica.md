# Documentação técnica interna

Esta página é **somente para a equipe AutoPainel**. Use para registrar decisões de arquitetura, contratos de API, migrações relevantes e links para artefatos no repositório.

## Como manter atualizado

1. Após o refinamento (**Architect + Backend**), registre aqui os contratos principais (RPCs, tabelas novas, políticas RLS em alto nível, Edge Functions).
2. Referencie sempre os tipos compartilhados em `packages/shared` e documentação cross-cutting em `packages/shared/docs/` quando aplicável.
3. Prefira **salvar pelo painel Admin** (botão «Salvar alterações»).
4. Este arquivo é **fallback** quando a migração `platform_internal_documents` ainda não foi aplicada.

---

## Supabase local (Docker + CLI)

Stack de desenvolvimento via **Supabase CLI** (`supabase start`), com Postgres, Auth, Storage, Studio e Edge Functions em Docker.

| Artefato | Caminho / comando |
| --- | --- |
| Config versionada | `supabase/config.toml` |
| Migrações | `supabase/migrations/` |
| Scripts npm (raiz) | `supabase:start`, `supabase:stop`, `supabase:status`, `supabase:reset` |
| Guia operacional | `packages/shared/docs/SUPABASE_LOCAL.md` |

**Correção (2026-05-27):** `20260506180000_fix_profiles_rls_recursion.sql` passou a recriar `profiles_update_authenticated_owner_peers` (em vez de `alter` em `admin_peers`, removida por `20260423120000`) — necessário para `supabase start` / `db reset` em instalação limpa.

Projeto remoto linkado: `wcgevmvystdhqpzwuyig` (AutoPainel). Alternar `.env.local` entre remoto e `http://127.0.0.1:54321` conforme cenário (ver guia).

**Keep-alive hosted (2026-05-27):** RPC `platform_health_ping`, tabela `platform_health_ping_log`, Edge Function `platform-health-ping`, script `npm run supabase:ping`, workflow `.github/workflows/supabase-health-ping.yml` (cron diário). Guia: `packages/shared/docs/SUPABASE_HEALTH_PING.md`. Migração: `supabase/migrations/20260527210000_platform_health_ping.sql`.

**Deploy automatizado (2026-05-27):** `npm run supabase:deploy` + workflows `.github/workflows/supabase-deploy.yml` (push `main` em `supabase/migrations/**`) e `supabase-migrations-check.yml` (PR dry-run). Manifesto: `supabase/deploy.manifest.json`. Guia: `packages/shared/docs/SUPABASE_DEPLOY.md`. Secrets GitHub: `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

**Deploy remoto validado (2026-06-10):** repair `20260527013053` (`reverted`) — registo em `supabase/MIGRATION_REPAIR_LOG.md`; push de 5 migrações (`20260526190000` … `20260527210000`); paridade 57/57 local│remoto; Edge Functions republicadas. Ping local falha com URL `127.0.0.1` sem Docker — usar `npm run supabase:ping:remote` com `SUPABASE_ANON_KEY` remota em `.env.local`.

**Segredos (2026-06-10):** `.env.local` reforçado no `.gitignore`; `npm run env:check-tracked`, `git:untrack-env`, `git:purge-secrets` — guia `packages/shared/docs/SECURITY_SECRETS.md`. Deploy script redige password/token nos logs.

---

## Roadmap épicos 0–5 (2026-06-10)

Decisões PM em `regras-de-negocio.md` (secção 2026-06-10). Ordem de **implementação** (prioridade workers):

| Épico | Nome | Entregas principais | Estado |
| --- | --- | --- | --- |
| **0** | Decisões PM | Business = finance+QR; equipe só admin; Meta Connect; workers first | ✅ Fechado |
| **2** | Workers integração | Ver tabela abaixo | ✅ Entregue (2026-06-10) |
| **3** | Produção multitenant | DNS wildcard, TLS, Auth redirects, CI lint/build/E2E | 🟡 CI + checklist + E2E; go-live DNS manual |
| **4** | Operação admin | Dashboard KPIs, busca global; sem equipe no painel loja | 🟡 KPIs + tendência leads + ⌘K módulos + filtro URL status |
| **1** | UX mobile + copy | EmptyState shared, Sheet nav admin, pt-BR operador | 🟡 EmptyState inbox/lojas + copy pt-BR residual |
| **5** | QA encerramento | QR físico, matriz cross-tenant, lapidação demo | 🟡 E2E 3 lojas demo + QR smoke |

### Épico 2 — detalhe técnico (workers)

| ID | Entrega | Artefactos previstos |
| --- | --- | --- |
| **E2-C1** | Edge `classifieds-sync-worker` — dequeue `classifieds_sync_jobs`, publish/delist OLX/WM | ✅ `supabase/functions/classifieds-sync-worker/` |
| **E2-C2** | UI painel: «Publicar nos classificados» na ficha veículo + badge status sync | ✅ `vehicle-classifieds-panel.tsx`, `classified-actions.ts` |
| **E2-C3** | Trigger/enqueue delist ao `status != available` ou `is_active = false` | ✅ migração `20260610120000_classifieds_sync_worker.sql` |
| **E2-M1** | Meta Connect plataforma (`META_PLATFORM_APP_ONLY`); remover form App ID da UI | ✅ `meta-platform-connect.ts`, Integrações |
| **E2-M2** | Edge `social-publish-worker` — MVP post Facebook (dry-run padrão) | ✅ `supabase/functions/social-publish-worker/` |
| **E2-M3** | Render carrossel Sharp (Route Handler Next, não Edge Deno) | ✅ `render-social-carousel-slides.ts`, bucket `social-carousel-artifacts` |
| **E2-M5** | Instagram carrossel Graph API (≥2 slides) | ✅ `social-publish-process-job.ts` |
| **E2-C4** | Cron GitHub Actions workers (15 min) | ✅ `.github/workflows/integration-workers-cron.yml` |
| **E2-UX1** | Hub Integrações facilitado (wizard Meta, aparência carrossel, onboarding) | ✅ `integracoes/page.tsx`, `carousel-appearance-card.tsx`, `meta-page-picker-dialog.tsx` |
| **E2-UX2** | Carrossel com watermark + slide CTA + preview na ficha veículo | ✅ `render-social-carousel-slides.ts`, `vehicle-social-share-panel.tsx`, `previewVehicleCarouselAction` |
| **E2-UX3** | Classificados granulares (OLX/WM toggles) + `external_listing_url` | ✅ `vehicle-classifieds-panel.tsx`, migração `20260610160000_integrations_ux_facilitated.sql` |
| **E2-UX4** | «Salvar e divulgar» no formulário de veículo | ✅ `vehicle-promotion-section.tsx`, `runVehicleSavePromotions` em `estoque/actions.ts` |
| **E2-S** | Secrets OLX/WM/Meta + homologação portais | DevOps / `.env.example` |

### Integradores classificados v2 — OLX + WebMotors + iCarros + auto-publish (2026-06-11)

**PRD:** `regras-de-negocio.md` (secção 2026-06-11). **Blueprint:** `packages/shared/docs/CLASSIFIEDS_INTEGRATORS_BLUEPRINT.md`. **Squad:** `.cursor/commands/squad.md` (épico integradores).

| ID | Entrega | Estado | Paths / notas |
| --- | --- | --- | --- |
**INT-0 concluído (2026-06-11):** migrações `20260611172939_classifieds_modules_by_provider.sql` + `20260611173013_classifieds_enqueue_module_gate.sql` aplicadas no remoto; `classifieds_sync` removido; enterprise/trial com os três módulos; código migrado para gating por portal.

**OAuth dev stub (2026-06-11):** ver `packages/shared/docs/CLASSIFIEDS_OAUTH_SETUP.md`. Credenciais reais OLX: homologação OLX → `OLX_OAUTH_*` → `npm run classifieds:oauth:platform:configure` + `classifieds:oauth:secrets:configure`. WebMotors real = password grant (INT-5b, não popup). Fix UI: removido `noopener` no popup + `GET /api/painel/integracoes/oauth/connection-status`.
| **INT-1** | Auto-publish pós create/update (P1–P6 **por portal**) | 🔴 pendente | `actions.ts` — filtrar providers por plano **e** conexão |
| **INT-2** | Delist antes de `deleteVehicleAction` | 🔴 pendente | `actions.ts` — trigger SQL não cobre DELETE |
| **INT-3** | Provider `icarros` end-to-end | 🔴 pendente | migration enum; `integrations-hub.ts`; adapter Edge; card UI |
| **INT-4** | Refresh token + `reauth_required` | 🔴 pendente | `classifieds-refresh-token` / worker |
| **INT-5** | Homologação APIs reais OLX/WM/iCarros | 🔴 pendente | `CLASSIFIEDS_SYNC_DRY_RUN=false` |
| **INT-7** | Republicar após update (preço/fotos) | 🟡 pendente | enqueue `publish` idempotente no update |

**Já entregue (base):** OAuth scaffold, fila `classifieds_sync_jobs`, worker `classifieds-sync-worker`, hub `/painel/integracoes`, ficha `vehicle-classifieds-panel.tsx`, trigger delist sold/inactive (`20260610120000_classifieds_sync_worker.sql`), toggles UX (`20260610160000`).

**Decisão PM (2026-06-11 revisão):** módulos **por portal** — plano escolhe integradores; loja só vê/conecta portais contratados. Bundle `classifieds_sync` legado até migração de planos.

**Paths a migrar de `classifieds_sync` → gating por portal:** `classified-actions.ts`, `oauth/start/route.ts`, `DashboardShell.tsx`, `vehicle-form-promotion-config.ts`, `integracoes/page.tsx`, `classifieds-integration-cards.tsx`, E2E `integrations-ux.spec.ts`.

**Migração prevista (INT-0):** `supabase/migrations/20260611172939_classifieds_modules_by_provider.sql` — seed `olx_sync`, `webmotors_sync`, `icarros_sync`; copia pivôs de `classifieds_sync`.

**Env previsto:** `ICARROS_OAUTH_*`, `ICARROS_LISTINGS_API_URL` em `.env.example`.


### Épico 2 — DevOps integrações (2026-06-11)

| Passo | Comando / doc |
| --- | --- |
| Status migrações | `npm run supabase:migrations:status` |
| Deploy migração + Edge | `npm run supabase:deploy` |
| Secrets workers cron | `npm run github:secrets:workers:manual` |
| Secrets render + Meta plataforma | `npm run integration:secrets:configure:manual` |
| Checklist completo | `packages/shared/docs/INTEGRATIONS_DEPLOY.md` |

Scripts novos: `scripts/configure-integration-secrets.mjs` (Edge `SOCIAL_CAROUSEL_*`, `META_PLATFORM_APP_ONLY` + lista Vercel).

Docs: `packages/shared/docs/META_INTEGRATION_SIMPLIFIED.md`, `SOCIAL_CAROUSEL_RENDER.md`, `INTEGRATIONS_DEPLOY.md`, `TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md`.

### Épico 2 — QA integrações UX facilitada (2026-06-11)

| ID | Entrega | Artefactos |
| --- | --- | --- |
| **E2-QA1** | E2E hub + gating plano + ficha/formulário veículo | ✅ `e2e/specs/dealership-panel-integrations-ux.spec.ts` |
| **E2-QA2** | E2E OAuth classificados (OAuth pendente / iCarros em breve) | ✅ `e2e/specs/dealership-panel-integrations-oauth.spec.ts` |
| **E2-QA3** | Matriz isolamento cross-tenant estoque | ✅ `e2e/specs/cross-tenant-isolation.spec.ts` (regressão) |
| **E2-QA4** | Revisão RLS + RPCs migração `20260610160000` | ✅ code review (policies `dealership_social_carousel_settings`, RPCs com `auth.uid()`) |

**Pré-requisito E2E:** `dealership-panel` em `3002`, seed demo (`guiotti` enterprise, `autoprime` business), migração `20260610160000` aplicada no Supabase usado pelo painel.

**Cenários E2E (Given / When / Then)**

| # | Cenário | Status |
| --- | --- | --- |
| 1 | Given gestor `guiotti` — When abre `/painel/integracoes` — Then vê Meta, aparência carrossel e OLX/WM | automatizado `integrations-ux.spec.ts` |
| 2 | Given gestor `ecodrive`/`autoprime` (starter/business) — When tenta `/painel/integracoes` — Then redirect `/painel` e menu sem link | automatizado `integrations-ux.spec.ts` |
| 3 | Given Ferrari demo — When abre ficha — Then painéis social + classificados visíveis | automatizado `integrations-ux.spec.ts` |
| 4 | Given `guiotti` sem Meta/portais conectados — When abre `/painel/estoque/novo` — Then «Salvar e divulgar» oculto (fix QA 2026-06-11) | automatizado `integrations-ux.spec.ts` |
| 5 | Given OAuth OLX/WM sem credenciais — When Conectar → Continuar para login — Then modal «Conexão em configuração» + POST 503 `oauth_not_configured` | automatizado `integrations-oauth.spec.ts` |
| 5b | Given iCarros no plano — When Conectar — Then botão ativo + modal «Em breve» | automatizado `integrations-oauth.spec.ts` |
| 6 | Given loja A vs B — When lista estoque — Then zero vazamento cross-tenant | automatizado `cross-tenant-isolation.spec.ts` |
| 7 | Given Meta conectada multi-página — When OAuth conclui — Then `page_selection_required` + diálogo escolha | manual (requer app Meta + migração remota) |
| 8 | Given preview carrossel — When clica «Ver preview» na ficha — Then modal com slides | manual (requer `SOCIAL_CAROUSEL_RENDER_SECRET` + Sharp) |
| 9 | Given `SOCIAL_PUBLISH_DRY_RUN=false` — When publica job social — Then IG+FB reais | manual homologação Meta |
| 10 | Given credenciais OLX/WM reais — When publica veículo — Then `external_listing_url` preenchido | manual homologação portais |

**Findings QA (2026-06-11)**

| # | Severidade | Descrição | Owner | Status |
| --- | --- | --- | --- | --- |
| 1 | 🔴 blocker | Migração `20260610160000` pendente no remoto — RPCs carousel/onboarding e status `page_selection_required` indisponíveis em produção | DevOps | open |
| 2 | 🔴 blocker | Publicação social real e OAuth Meta multi-página não validados E2E (depende deploy + App Meta + `SOCIAL_PUBLISH_DRY_RUN=false`) | DevOps + QA manual | open |
| 3 | 🟡 minor | `list_dealership_meta_page_candidates` sem gate `social_media_kit` (baixo risco: só retorna dados com `page_selection_required`) | Backend | deferred |
| 4 | 🟡 minor | Credenciais OLX/WebMotors reais ausentes — fluxo feliz publish/delist bloqueado | DevOps | open |
| 5 | 🟡 minor | «Salvar e divulgar» aparecia sem checkboxes quando Meta/portais desconectados — corrigido em `VehicleForm` + `isVehiclePromotionActionAvailable` | Frontend | fixed |
| 6 | 🟡 minor | Seed demo: confirmar migração `20260526153000` aplicada (autoprime=business, ecodrive=starter) antes de E2E gating | DevOps | open |

**Comando E2E focado:**

```bash
npm run dev:all   # ou só dealership-panel :3002
npx playwright test e2e/specs/dealership-panel-integrations-ux.spec.ts e2e/specs/dealership-panel-integrations-oauth.spec.ts
```

### Recibo de venda (`recibo_compra`) — arquitetura (2026-06-11)

**Status:** PRD aprovado; migração aplicada no remoto; Backend + Frontend entregues (2026-06-11).

| ID | Entrega | Estado |
| --- | --- | --- |
| **SR-A1** | Módulo `recibo_compra` + pivot planos | ✅ migrações `20260611143000_*`, `20260611180000_*`, `20260611210000_remove_sale_receipt_duplicate_module.sql` |
| **SR-A2** | Tabela `vehicle_sale_receipts` + RLS tenant | ✅ |
| **SR-A3** | Colunas `vehicles.license_plate`, `vehicles.renavam` | ✅ |
| **SR-A4** | RPCs `upsert_vehicle_sale_receipt`, `get_vehicle_sale_receipt` | ✅ SQL |
| **SR-A5** | Tipos `packages/shared/src/types/sale-receipt.ts` | ✅ |
| **SR-A6** | Validador CPF/CNPJ `lib/validators/buyer-document.ts` | ✅ |
| **SR-B1** | Server actions + payload print | ✅ `sale-receipt-actions.ts`, `get-vehicle-sale-receipt-page-context.ts`, `map-sale-receipt-row.ts`, `validate-sale-receipt-input.ts` |
| **SR-F1** | Ficha vendido + rota `/painel/estoque/[vehicleId]/recibo` | ✅ `SoldVehicleReceiptCard`, `SaleReceiptWorkspace`, `SaleReceiptPrintSheet`, `SaleReceiptPrintToolbar`, `MarkVehicleAsSoldButton` |

#### Contratos RPC

| RPC | Args | Retorno | Auth | Notas |
| --- | --- | --- | --- | --- |
| `upsert_vehicle_sale_receipt` | `UpsertVehicleSaleReceiptArgs` | `vehicle_sale_receipts` row | authenticated | Veículo deve estar `sold`; gate `recibo_compra` |
| `get_vehicle_sale_receipt` | `p_vehicle_id` | row | authenticated | `receipt_not_found` se ausente |

`payment_lines` JSON: `[{ "method": "pix"|"cash"|..., "amount": number }]`

#### Superfície frontend (entregue)

| Rota / componente | Path |
| --- | --- |
| `/painel/estoque/[vehicleId]/recibo` | `apps/dealership-panel/src/app/painel/estoque/[vehicleId]/recibo/page.tsx` |
| `SoldVehicleReceiptCard` | `components/inventory/sold-vehicle-receipt-card.tsx` |
| `SaleReceiptWorkspace` | `components/inventory/sale-receipt-workspace.tsx` (form + preview) |
| `SaleReceiptPrintSheet` | `components/inventory/sale-receipt-print-sheet.tsx` |
| `SaleReceiptPrintToolbar` | `components/inventory/sale-receipt-print-toolbar.tsx` |
| `MarkVehicleAsSoldButton` | `components/inventory/mark-vehicle-as-sold-button.tsx` — listagem + ficha (`markVehicleAsSoldAction`); redireciona à ficha após marcar na listagem |
| `UnmarkVehicleAsSoldButton` | `components/inventory/unmark-vehicle-as-sold-button.tsx` — desfazer venda (`unmarkVehicleAsSoldAction`) |

**Gating:** `isSaleReceiptModuleEnabled(keys)` — chave `recibo_compra` via `effective_feature_keys_for_active_dealership` + plano `pricing_plan_modules`.

#### Recibo de venda — UX Writer (copy aprovada)

| Elemento | Copy pt-BR |
| --- | --- |
| Secção ficha | **Recibo de venda** |
| CTA | **Imprimir recibo** / **Salvar e imprimir** |
| Disclaimer tela | **Recibo simples, sem validade fiscal.** Não substitui nota fiscal eletrônica. |
| Disclaimer impresso | Documento emitido para fins informativos. Sem validade fiscal. |
| Comprador | Nome completo · CPF ou CNPJ · Endereço de cobrança |
| Pagamento | Forma de pagamento · Valor · **Adicionar forma de pagamento** |
| Entrada | Valor de entrada (opcional) |
| Veículo | Placa · RENAVAM · Modelo · Tipo |
| Assinaturas | Assinatura da loja · Assinatura do comprador |
| Empty | **Nenhum recibo emitido ainda** — Registre os dados do comprador para gerar o comprovante. |
| Erro documento | Informe um CPF ou CNPJ válido. |
| Erro veículo | Só é possível emitir recibo para veículos marcados como vendidos. |
| Módulo off | A emissão de recibo de venda não está incluída no plano da sua loja. |

Migração `20260611143000_sale_receipt_module.sql` aplicada no remoto (2026-06-11).

### Épico 3 — produção multitenant (2026-06-10)

| ID | Entrega | Artefactos |
| --- | --- | --- |
| **E3-C1** | CI lint + build em PR/push `main` | ✅ `.github/workflows/ci.yml` |
| **E3-C2** | Checklist DNS/TLS/Auth redirects | ✅ `packages/shared/docs/PRODUCTION_MULTITENANT_CHECKLIST.md` |
| **E3-Q1** | E2E isolamento cross-tenant | ✅ `e2e/specs/cross-tenant-isolation.spec.ts` |

Pendente operacional: aplicar checklist no Vercel/Supabase Auth antes de go-live por domínio real.

### Épico 4 — operação admin (2026-06-10)

| ID | Entrega | Artefactos |
| --- | --- | --- |
| **E4-D1** | KPIs ampliados (leads 7d, pending_setup, past_due) | ✅ `platform-metrics.ts`, `dashboard/page.tsx` |
| **E4-D2** | Command palette com concessionárias, planos e módulos | ✅ `command-palette-entities.ts`, `admin-shell.tsx` |
| **E4-D3** | Ações rápidas no dashboard | ✅ `dashboard/page.tsx` |
| **E4-D4** | Filtro `?status=` na listagem de concessionárias | ✅ `concessionarias/page.tsx`, `dealerships-table.tsx` |
| **E4-D5** | Tendência leads 7d vs período anterior | ✅ `platform-metrics.ts`, dashboard |

### Épico 1 — UX mobile + copy (2026-06-10)

| ID | Entrega | Artefactos |
| --- | --- | --- |
| **E1-N1** | Nav mobile admin via Sheet (substitui scroll horizontal) | ✅ `admin-mobile-nav.tsx` |
| **E1-C1** | Badge «Plataforma»; copy pt-BR residual | ✅ `admin-shell.tsx`, `conta-inativa/page.tsx`, dashboard loja |
| **E1-U1** | `EmptyState` compartilhado | ✅ `packages/shared/src/components/empty-state.tsx` |
| **E1-U2** | EmptyState em concessionárias e inbox contatos | ✅ `dealerships-table.tsx`, `LeadInbox.tsx` |
| **E1-C2** | Copy pt-BR residual (Meta, colaboradores) | ✅ `integration-user-messages.ts`, `dealership-collaborators.ts` |

### Épico 5 — QA (2026-06-10)

| ID | Entrega | Artefactos |
| --- | --- | --- |
| **E5-Q1** | Matriz cross-tenant guiotti/autoprime/ecodrive | ✅ `e2e/specs/cross-tenant-isolation.spec.ts` |
| **E5-Q2** | Smoke lâmina QR veículo demo | ✅ `e2e/specs/vehicle-qr-print.spec.ts` |
| **E5-Q3** | Lapidação vitrine demo | ✅ existente `storefront-lapida-qa.spec.ts` |

Pendente manual: impressão física QR (cross-browser print dialog).

---

---

## Iniciativa — módulos da plataforma (2026)

Ordem de entrega acordada pelo time: **começar pelo Simulador de financiamento** (`saas_modules.key = 'finance_simulator'`). Blueprint de catálogo dinâmico e RLS: `packages/shared/docs/PRD_DYNAMIC_PRICING_PLANS_AND_MODULES.md`.

**Próximo passo de governança:** PRD detalhado por módulo em `regras-de-negocio.md` (secção abaixo); aqui registam-se **contratos e código** assim que o PRD existir ou após cada incremento implementado.

---

### Índice técnico de módulos

| Módulo | Status técnico | Próximo passo |
| --- | --- | --- |
| `finance_simulator` | Passos A-D executados (com ajustes de RLS e RPC no remoto) | Hardening e cleanup de QA |
| `qr_generator` | **Passo C implementado no repositório** | QA funcional final (escaneamento + impressão cross-browser) |
| `advanced_metrics` | **Passos C-D técnicos concluídos (migrações sincronizadas)** | QA visual final manual (desktop/tablet + fallback) |
| `classifieds_sync` | **Passo C inicial implementado no repositório** | Homologar credenciais reais OLX/WebMotors + QA E2E |
| `social_media_kit` | Passo C inicial: schema + OAuth popup + página Integrações Meta | Sharp + Storage + Edge worker Graph + formulário veículo + QA |
| `dealership_management_hub` | Passo B parcial: tabelas + `manager` + RPC host painel + bloqueio `status` no dashboard | Tabs admin, UX pessoas, export CSV financeiro, RLS só `super_admin` em cobrança |

---

### Central de gestão (Admin Master) — arquitetura e execução (2026-05-08)

| Campo | Valor |
| --- | --- |
| **Iniciativa** | Central de edição da concessionária: pessoas colaboradoras (RBAC), financeiro SaaS (operador), notas internas e auditoria |
| **Apps** | `admin-master`, `dealership-panel` (bloqueio de painel quando `dealerships.status <> 'active'`), `customer-site` (**já** filtra `active` nas RPC públicas / resolução de host) |
| **Migração** | `supabase/migrations/20260508100000_dealership_management_hub_scaffold.sql` |

#### Modelo API-first (Architect)

| Superfície | Responsabilidade |
| --- | --- |
| `admin-master` (Server Actions + RLS) | CRUD pessoas colaboradoras, acordo mensal (`dealership_billing`), lançamentos em `dealership_billing_history`, escrita em `platform_audit_logs` |
| `dealership-panel` | Nunca leia tabelas de cobrança SaaS com JWT tenant; apenas checagens de papel para futuras páginas de «finanças da loja» (escopo ERP distinto quando existir) |
| Postgres | Fonte de verdade; RLS garante tenant vs. operador |

#### Esquema (novas / alterações)

1. **`public.dealership_billing`** — 1:1 com `dealerships`: valor mensal (`monthly_amount`), `due_day`, método de pagamento, `last_payment_date`, `contract_started_on` / `contract_ends_on` (período contratual SaaS), `agreement_status`, `internal_notes` (legado operacional; UI passa a usar sobretudo `dealerships.billing_notes`).
2. **`public.dealership_billing_history`** — mensalidades: referência/competência, valor, `due_date`, `paid_at`, estado `paid/pending/overdue`; `supporting_documents` jsonb manifesto de anexos (Paths no Storage bucket privado **`dealership-operator-billing`**; descarga só via URLs assinadas geradas pelo `admin-master` com sessão super admin).
3. **`storage.buckets`** — cofre **`dealership-operator-billing`** (privado; uploads no painel mestre via Edge/service role conforme migrações).
4. **`public.platform_audit_logs`** — `{ actor_profile_id; action_key; entity_type; entity_uuid; payload jsonb }` para operações sensíveis (plano, valor, `dealerships.status`).
5. **`profiles.role`** — enum alargado com **`manager`**, com mesmo `dealership_id` obrigatório que `owner`/`seller`. Políticas de leads/atualização de loja atualizadas para **`owner` OU `manager`**.

**Compatibilidade:** colunas herdadas `subscription_plan`, `subscription_status`, `billing_notes` em `dealerships` permanecem até migração de dados dirigida pela operação → backfill opcional futuro para `dealership_billing`.

#### Resolução de host — painel vs. vitrine

**Governação de entrega:** evoluções de produto nesta área seguem o bloqueio **PRD (PM) completo → UX → refinamento técnico → dev → QA** descrito em `regras-de-negocio.md` («Bloqueio squad — PRD completo (PM) + UX antes de desenvolvimento e QA»).

**PRD `tenant_operator_journey`:** **Aprovado** (2026-05-08) em `regras-de-negocio.md` — BZ-TOJ-*, CA-TOJ-*, decisões PM na **13.1**, handoff UX (Fase 2) na **13.2**. **Handoff UX confirmado** (2026-05-08); esta seção permanece a referência de implementação (RPCs, rotas, env).

#### Fase 3 — Arquiteto + Backend (`tenant_operator_journey`, pós-handoff UX)

**Resumo:** o desenho **Host → RPC → cookie** já está implementado. Este incremento **não exige** migração nova nem RPC nova para cumprir BZ-TOJ/CA-TOJ **salvo** evolução futura de **301 www→ápice** (ver abaixo). A Fase 3 formaliza **contratos TypeScript**, **superfícies** e **prompts de execução para Fase 4 (Frontend)**.

**Contratos TypeScript (`packages/shared`)**

| Contrato | Ficheiro | Uso |
| --- | --- | --- |
| `DealershipSubdomainSurfaceUrls` | `packages/shared/src/lib/tenant/dealership-subdomain-surface-urls.ts` | URLs canónicas e pré-visualização `*.localhost` (Admin). |
| `ResolveDealershipIdByHostArgs` | `packages/shared/src/types/supabase-rpc.ts` | Argumentos de `resolve_dealership_id_by_host`. |
| `ResolveDealershipIdByHostForDashboardArgs` | idem (alias do mesmo par) | `resolve_dealership_id_by_host_for_dashboard`. |
| `DealershipStatus` | `packages/shared/src/types/index.ts` | Valores `active` \| `suspended` \| `pending_setup` \| `churned` — só referência de produto em UI/docs; **não** expor diferença na copy pública da vitrine (BZ / 13.1 O2). |

**Superfície RPC / middleware (já em produção no repo)**

- `public.resolve_dealership_id_by_host(p_host, p_platform_root_domain)` — vitrine.
- `public.resolve_dealership_id_by_host_for_dashboard(...)` — painel (middleware `dealership-panel`).
- `public.get_dealership_id_by_slug_for_dashboard` — só bootstrap `GET /painel/acesso/:slug` com flag dev.
- Resolução de raiz: `resolveEffectivePlatformRootDomain` (`packages/shared/src/lib/tenant/effective-platform-root-domain.ts`); hosts normalizados sem porta nas RPCs (`normalizeHost` + migrações listadas abaixo na cadeia longa desta seção).

**Admin — ordem dos atalhos (UX 13 / PRD)** — `DealershipOperatorSurfaceLinks` (`apps/admin-master/src/components/dealership-operator-surface-links.tsx`) já renderiza **Abrir painel da loja** antes de **Abrir site público (vitrine)**; nenhuma alteração obrigatória de layout nesta fase.

**Domínio próprio — O1 (301 www→ápice)**

- **Preferência de produto:** redirect **301** de `www.{custom}` → `{custom}` (ou política inversa **única** documentada em Operations), configurado no **provedor de DNS / edge** (Vercel redirect, CDN, ou middleware Next **só** se a equipa optar por implementação em código).
- **Escopo Fase 3:** sem tarefa de base obrigatória; se no futuro se guardar «canónico preferido» por loja, abrir PRD delta + migração.

**Variáveis de ambiente (extensão opcional para Fase 4 — rodapé O3)**

- Proposta: `NEXT_PUBLIC_AUTOPAINEL_SITE_URL` (URL institucional/marketing, **https**). Se vazio, **não** renderizar link «Sobre a AutoPainel» na página de erro (comportamento seguro).

---

**Prompts de execução — Fase 4 (Frontend)** *(consumir tipos existentes; sem redefinir shapes de RPC)*

1. **`customer-site` + `dealership-panel` — `/erro/concessionaria`:** alinhar copy ao **O2** (uma família de mensagem; **não** mencionar `active` / estado na mensagem principal da vitrine). pt-BR (`naming-and-language.mdc`).
2. **Dev — BZ-TOJ-011:** envolver `DevResolutionHints` em **`<details>`** (fechado por padrão), rótulo «Detalhes para a equipe técnica» — **entregue** (sem novo componente `@autopainel/shared/ui`; nativo por simplicidade e acessibilidade).
3. **Rodapé O3:** link secundário opcional para `NEXT_PUBLIC_AUTOPAINEL_SITE_URL` quando definido; `rel="noopener noreferrer"` se externo.
4. **Acessibilidade O6:** hierarquia `h1` único, ordem de foco lógica, contraste AA nos dois temas; rever `aria` dos botões de erro.
5. **Checklist dev:** harmonizar redação pt-BR entre as duas apps (hoje mistura «Confirme»/«utilizou»/termos PT).

**Fase 4 entregue no repositório:** `apps/dealership-panel/src/app/erro/concessionaria/page.tsx`, `apps/customer-site/src/app/erro/concessionaria/page.tsx`, `e2e/specs/dealership-panel-tenant.spec.ts` (título esperado no E2E alinhado ao novo `h1`). Copy pública unificada (O2); checklist só em `development` dentro de `<details>`; rodapé opcional «Sobre a AutoPainel».

#### Fase 5 — QA (`tenant_operator_journey`)

**Automatizado (Playwright)** — `npm run test:e2e` com `dealership-panel` + `customer-site` no ar (`npm run dev:all` ou portas equivalentes). Ficheiros: `e2e/specs/dealership-panel-tenant.spec.ts`, `e2e/specs/customer-site-tenant.spec.ts`, `e2e/helpers/tenant-error-page.ts`.

| CA / tema | Cobertura E2E | Manual / notas |
| --- | --- | --- |
| **CA-TOJ-001** (vitrine, slug inexistente → erro, sem «404» no título) | `customer-site` slug falso + `127.0.0.1` erro + asserts de `h1` | — |
| **CA-TOJ-002** (loja não `active` → erro, copy unificada) | Parcial: se slug errado cai em `/erro/concessionaria`, mesmo `h1` que CA-001 | Confirmar na BD loja `suspended` e URL da vitrine; texto **não** deve revelar estado |
| **CA-TOJ-003 / 004** (atalhos Admin) | Fora do E2E actual | Clicar em **Abrir painel** / **Abrir site público** no Admin |
| **CA-TOJ-005** (slug CI) | Fora do E2E | Criar loja com slug `MinhaLoja`, abrir `minhaloja.localhost` |
| **CA-TOJ-006** (anti-enumeração) | Parcial (sem página pública de slug) | Auditoria de rotas; mensagens iguais para cenários O2 |
| **CA-TOJ-007** (bootstrap `/painel/acesso/:slug`) | Fora do E2E | `NEXT_PUBLIC_ENABLE_DEALERSHIP_PANEL_SLUG_BOOTSTRAP=false` em prod |
| **CA-TOJ-008** (raiz efectiva `localhost` com env prod) | Fora do E2E | `.env` com raiz produção + `*.localhost` |
| **CA-TOJ-009** (login sem jargão) | Fora do E2E | Fluxo credenciais inválidas em `/login` |
| **CA-TOJ-010** (sem checklist em prod) | E2E: `<details>` ausente ou skip se `next start` prod | Build `production` + smoke: **não** deve existir «Detalhes para a equipe técnica» |
| **Hero + a11y** | E2E: um só `h1`, título sem «404»; disclosure fechado em dev | Teclado: Tab até CTA e `<summary>` |

**Matriz de permissões (resumo)** — `anon` resolve host via RPC invoker; JWT tenant só em rotas autenticadas do painel; `super_admin` no Admin não mistura dados entre lojas na UI de atalhos (só gera URLs por `slug` escolhido). Detalhe: políticas RLS nas migrações listadas na secção «Resolução de host» acima.

**Segurança Supabase (checklist)** — [ ] Redirect URLs cobrem `*.localhost` em dev; [ ] `SUPABASE_SERVICE_ROLE_KEY` só em servidor; [ ] sem `NEXT_PUBLIC_*` para service role; [ ] Advisor sem regressão em políticas `dealerships`; [ ] wildcard TLS em produção antes de partilhar links.

**Riscos de regressão** — Mudança de copy quebra E2E se o `h1` divergir de `TENANT_ERROR_HEADING_RE` em `e2e/helpers/tenant-error-page.ts`; `NODE_ENV=production` nos testes sem `<details>` faz skip do teste de disclosure.

**Achados (preenche na revisão)** — Execução local `npm run test:e2e` (2026-05-08): **9 passed**, **2 skipped** (`E2E_DEALERSHIP_SLUG` vazio — fluxos feliz painel/vitrine). Smoke **produção** (CA-TOJ-010) continua manual.

**Fase 6 — Sprint review** — Resumo: Fase 4 (UI erro) + Fase 5 (matriz QA + E2E reforçado). Riscos: smoke prod manual pendente (CA-TOJ-010). Follow-up: opcional E2E contra `next build && next start` em job CI.

- **`resolve_dealership_id_by_host`**: continua a devolver apenas lojas **`status = 'active'`** (vitrine + cookie seguro para visitantes).
- **`resolve_dealership_id_by_host_for_dashboard`**: mesma lógica de host **sem** filtro de `status`; no **`dealership-panel`** o middleware usa **sempre** este modo para todas as rotas que exigem cookie de tenant (`/` incluído — antes só `/painel` e `/login` usavam dashboard e `/` caía na RPC «vitrine», gerando `/erro/concessionaria`). **`customer-site`** continua com `resolve_dealership_id_by_host` (só `active`).
- **`get_dealership_id_by_slug_for_dashboard`**: usada apenas por **`GET /painel/acesso/:slug`** quando **`NEXT_PUBLIC_ENABLE_DEALERSHIP_PANEL_SLUG_BOOTSTRAP=true`** (dev/opt-in; **desligado** por defeito — sem página pública de slug); resolve o `id` pelo slug **sem** exigir `active` (painel); produção permanece **`Host`**/`custom_domain` + URLs geradas no Admin («Acesso à loja»).
- **Multi-loja local com subdomínio** (`{slug}.localhost:PORT`): com `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=localhost`, o primeiro segmento do host mapeia `dealerships.slug`. **Painel em `localhost` nu:** usar botões do Admin ou subdomínio local; opcionalmente bootstrap por path só com flag acima; a vitrine pode ainda usar variáveis legadas `DEVELOPMENT_TENANT_*` em cenários pontuais (`readDevelopmentTenantSlugFromEnv`). Desenho OAuth por concessionária, migração Vercel e **revisão por função (PM/UX/Backend/Frontend/QA):** `packages/shared/docs/TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md` (§7). **Credenciais OAuth app por loja (classificados):** `supabase/migrations/20260508220000_dealership_classifieds_oauth_apps.sql` + tipos `classifieds-oauth-app.ts`.
- **Slug case-insensitive no resolver:** `supabase/migrations/20260508240000_resolve_dealership_host_slug_ci.sql` — comparação de `dealerships.slug` com o subdomínio via `lower(trim(...))` para evitar falhas quando o registo na BD difere em maiúsculas do host.
- **Rota `/erro/concessionaria` (painel + vitrine):** quando o middleware não resolve `dealership_id` a partir do host (RPC devolve `null`), redireciona-se para esta rota em **`dealership-panel`** e **`customer-site`**. **Não** confundir com o erro HTTP 404 do Next.js: a página comunica em PT sem usar «404» como título; em `development` o checklist técnico fica dentro de `<details>` (fechado por padrão). Implementação: `apps/dealership-panel/src/app/erro/concessionaria/page.tsx`, `apps/customer-site/src/app/erro/concessionaria/page.tsx`. Critérios de falha comuns: `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` vazio no Edge (mitigado para hosts `*.localhost` — ver abaixo); slug inexistente; vitrine com loja não `active`. Código: `resolveDealershipIdFromHost`, RPCs acima, `apps/*/src/lib/supabase/middleware.ts` (padrões por app). **Next.js 16:** a convenção ativa para boundary de rede é `src/proxy.ts`; manter só `middleware.ts` no root do app deixa a resolução de tenant inoperante em runtime. Correção aplicada em `apps/dealership-panel/src/proxy.ts` e `apps/customer-site/src/proxy.ts`. **Mitigação `*.localhost`:** `resolveEffectivePlatformRootDomain` (`packages/shared/src/lib/tenant/effective-platform-root-domain.ts`) — quando o `Host` (sem porta) é `{slug}.localhost`, a raiz passada às RPCs é **sempre** `localhost` **antes** de usar `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`, para evitar `null` em dev com env já apontado para produção (ex.: `autopainel.com.br` + host `guiotti.localhost`). Se a variável pública faltar no Edge e o host for `*.localhost`, o resultado continua `localhost`. Logging opcional `[tenant-host-resolve]` nos resolvers quando a RPC falha. **`localhost` nu:** usar `http://slug.localhost:PORT` ou `NEXT_PUBLIC_DEVELOPMENT_TENANT_SLUG` + redireccionamento (`buildBareLocalhostTenantRedirectUrl` em `development-tenant-slug-env.ts`) — o Edge pode omitir `DEVELOPMENT_TENANT_SLUG`. **RLS (correção 2026-05-08):** migração `supabase/migrations/20260508253000_resolve_dealership_id_by_host_private_impl.sql` — lógica em `private.resolve_dealership_id_by_host_impl`; `public.resolve_dealership_id_by_host` é delegate **SECURITY INVOKER** (alinhado a `get_dealership_public_by_slug`), para o `anon` não depender de política `SELECT` em `dealerships` durante a resolução do host. **Reforço:** `supabase/migrations/20260508254500_resolve_dealership_id_by_host_impl_row_security_off.sql` — `perform set_config('row_security', 'off', true)` no início do corpo da função (executado como dono da função no Supabase), para eliminar `null` persistente quando RLS ainda bloqueava o `SELECT` interno. **Sufixo do host (2026-05-08):** `supabase/migrations/20260508262000_host_resolver_platform_suffix_without_like.sql` — deixa de se usar `LIKE '%.' || v_root` para validar subdomínio da plataforma; usa `right(v_host, char_length(v_root)+1) = '.' || v_root` (evita falsos `null` em alguns ambientes). **Dono das funções (2026-05-08):** `supabase/migrations/20260508263500_resolve_host_impl_owner_matches_dealerships.sql` — `ALTER FUNCTION ... OWNER TO` o mesmo papel que possui `public.dealerships`, para os `SELECT` em `SECURITY DEFINER` beneficiarem do bypass de RLS do dono da tabela (sem isto, o papel dono da função migrada não tem política `authenticated` e o resolver devolve sempre `null`). **Estado `status` normalizado (2026-05-08):** `supabase/migrations/20260508265000_resolve_host_status_trim_and_positional_delegate.sql` — filtro `lower(trim(d.status)) = 'active'` na vitrine e delegate `public` com `$1,$2` (evita `status` com espaços invisíveis e edge cases no corpo SQL). **Port no Host / regexp PostgreSQL (2026-05-12):** `supabase/migrations/20260512184500_host_resolver_strip_port_posix_digit_class.sql` — remove sufixo `:porta` com `:[0-9]+$` em vez de `:\\d+$`: num literal SQL não‑E, `\d` não é classe de dígitos, pelo que `guiotti.localhost:3002` ficava sem normalizar e as RPC devolviam `null`. As apps (`dealership-panel`, `customer-site`) enviam também `p_host` sem porta (`normalizeHost`). **Grant obrigatório para vitrine:** `public.get_dealership_public_by_id(uuid)` precisa de `grant execute to anon, authenticated`; sem isto a vitrine em host válido cai em `/erro/concessionaria` com `permission denied`.

- **Painel — bootstrap opcional por path:** rota `apps/dealership-panel/src/app/painel/acesso/[slug]/route.ts` só quando **`NEXT_PUBLIC_ENABLE_DEALERSHIP_PANEL_SLUG_BOOTSTRAP=true`**; middleware `cookie` + RPC dashboard; helper `packages/shared/src/lib/tenant/allow-cookie-tenant-fallback-host.ts`. **Admin Master — `DealershipOperatorSurfaceLinks`:** em `NODE_ENV=development`, os botões principais usam **`buildLocalhostDealershipPreviewUrls`** (`packages/shared/src/lib/tenant/dealership-subdomain-surface-urls.ts`) para `http://{slug}.localhost:{3002|3003}`, mesmo quando **`NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`** já é o domínio de produção — evita abrir `https://{slug}.{root}` sem serviço local; bloco monospace opcional mostra URL canónico de **`buildDealershipSubdomainSurfaceUrls`**. Produção (`NODE_ENV=production`): só URLs canónicos.
- **Whitelabel (Fase Frontend — 2026-05-13):** formulário de concessionária em `apps/admin-master/src/components/dealership-form.tsx` inclui `storefront_theme_mode` (`light`/`dark`) e grava em `theme_config.storefront_theme_mode` via `apps/admin-master/src/actions/dealerships.ts`. Resolução visual no `customer-site` passa por `packages/shared/src/lib/theme/branding.ts` (`resolveDealershipBranding`) com fallback de fundo/superfície por modo: claro (`#fafafa/#ffffff`) e escuro (`#0b1120/#111827`). Tabela de concessionárias exibe coluna de tema para operação rápida (`apps/admin-master/src/components/dealerships-table.tsx`).
- **Polimento operacional (Fase Frontend — 2026-05-13):** `apps/admin-master/src/components/dealerships-table.tsx` recebeu filtros rápidos (busca por nome/slug/domínio/plano; selects por status/tema/plano), badges por status/plano/tema e contadores de carteira por estado (`active`, `pending_setup`, `suspended`, `churned`) para reduzir tempo de triagem no backoffice.
- **Catálogo planos × módulos × lojas (2026-05-27):** fluxo único **Módulos → Planos → Plano na concessionária**. Removidos checkboxes legados `enabled_features` / `DEALERSHIP_OPTIONAL_FEATURES` do formulário de loja; `createDealershipAction` / `updateDealershipAction` exigem `pricing_plan_id` e gravam `enabled_features: []` (gating efetivo via RPC `effective_feature_keys_for_active_dealership`). Ficha da loja em abas (`geral`, `vitrine`, `plano`, `unidades`, `equipe`, `financeiro`) — preview read-only dos módulos do plano em `dealership-plan-modules-preview.tsx`; lista de planos com contagem de módulos; tabela de concessionárias resolve nome do plano por `pricing_plan_id`. Removido `dealership-dialog.tsx` (código morto). Paths: `dealership-form.tsx`, `actions/dealerships.ts`, `lib/data/pricing-catalog.ts` (`fetchPlanModulesMapForAdmin`, `fetchPricingPlanModuleCountsForAdmin`), páginas `/painel/modulos`, `/painel/planos`, `/painel/concessionarias/*`.
- **Consolidação classificados (2026-05-27):** removido módulo legado `olx_sync` («Integração OLX») do catálogo; única chave `classifieds_sync` cobre OLX + WebMotors (gating já existente no `dealership-panel`). Migração `supabase/migrations/20260527200000_consolidate_classifieds_saas_module.sql` — migrar pivôs de plano e apagar linha duplicada em `saas_modules`.

#### Fase 5 — QA (`admin_master_visual_refresh`)

**E2E (automatizado)**

- Suite de tenant executada após alterações visuais/tema (`E2E_DEALERSHIP_SLUG=guiotti npm run test:e2e`): **12 passed**.
- Cobertura automática desta suite permanece focada em resolução de tenant e regressões críticas (`/erro/concessionaria`, host canónico, login redirect), garantindo que o pacote de UI não regressou o fluxo principal de acesso às lojas.

**Cenários QA (Given / When / Then) — pacote atual**

Test: filtro por status e busca textual na lista de concessionárias  
Given: operador `super_admin` autenticado no `admin-master`  
When: aplica filtro de status + texto (nome/slug/domínio/plano) em `/painel/concessionarias`  
Then: tabela mostra apenas linhas compatíveis e estado vazio contextual quando não há resultados  
Status: [ ] manual pendente

Test: tema base da vitrine persistido por loja  
Given: loja editável em `/painel/concessionarias/[id]/editar`  
When: operador alterna `storefront_theme_mode` para `light` e depois `dark` e guarda  
Then: valor persiste em `theme_config.storefront_theme_mode` e volta no formulário após refresh  
Status: [ ] manual pendente

Test: reflexo visual no `customer-site` (tema claro)  
Given: loja com `storefront_theme_mode=light`  
When: visitante abre `http://{slug}.localhost:3003`  
Then: shell aplica fallback de superfícies claras (`--dealer-bg`/`--dealer-surface`) sem quebrar contraste  
Status: [ ] manual pendente

Test: reflexo visual no `customer-site` (tema escuro)  
Given: loja com `storefront_theme_mode=dark`  
When: visitante abre `http://{slug}.localhost:3003`  
Then: shell aplica fallback de superfícies escuras (`--dealer-bg`/`--dealer-surface`) sem quebrar legibilidade dos CTAs  
Status: [ ] manual pendente

Test: badges e contadores operacionais  
Given: lista com lojas em múltiplos estados  
When: operador abre `/painel/concessionarias`  
Then: badges de status/plano/tema e contadores (`total`, `active`, `pending_setup`, `suspended`, `churned`) refletem os dados atuais  
Status: [ ] manual pendente

**Matriz de permissões / RLS (feature atual)**

| Role | Ação | Resultado esperado |
| --- | --- | --- |
| `super_admin` | ver/filtrar lista de concessionárias no Admin | ✅ permitido |
| `super_admin` | editar `storefront_theme_mode` em concessionária | ✅ permitido |
| `owner` / `manager` / `seller` | acessar rota do `admin-master` de concessionárias | ❌ bloqueado por `requireAdminSession` / RBAC |
| `anon` | acessar `admin-master` | ❌ redirecionado para autenticação |
| `anon` (vitrine) | ler loja ativa por host (`get_dealership_public_by_*`) | ✅ permitido (com grants corretos) |
| `anon` (vitrine) | resolver host inválido / loja não ativa | ❌ sem dados; redireciona para `/erro/concessionaria` |

**Checklist de segurança (Supabase + app)**

- [x] Nenhuma nova tabela criada; sem regressão de RLS por DDL no pacote atual.
- [x] `storefront_theme_mode` é metadado de apresentação (não sensível) em `theme_config`.
- [x] Sessão `super_admin` continua obrigatória para mutações no `admin-master`.
- [x] Suite E2E de tenant manteve 12/12 após mudanças de UI.
- [ ] Smoke manual em produção para confirmar contraste final do tema escuro com branding extremo.

**Riscos de regressão**

- Alterações de contraste da marca (cores muito próximas) podem reduzir legibilidade em modo escuro em casos extremos.
- Filtros client-side em listas muito grandes podem exigir paginação/filtro server-side numa próxima iteração.
- Divergência futura entre coluna dedicada e `theme_config.storefront_theme_mode` se uma migração de normalização não for aplicada.

**Achados**

- Sem bloqueantes técnicos na rodada atual.
- Regressão crítica de tenant não detectada após o pacote visual (E2E 12/12).

**Fase 6 — Sprint review (concluído em 2026-05-13)**

- Entregue: refinamento visual do `admin-master`, filtros operacionais e tema claro/escuro por loja refletido na vitrine.
- Riscos remanescentes: validação manual de contraste com combinações extremas de branding no modo escuro.
- Follow-up recomendado: considerar normalização definitiva de `storefront_theme_mode` em coluna dedicada de `dealerships` + filtro server-side quando volume de lojas crescer.

#### UX (Passo B — tabs sugeridas)

`Tabs` (`@autopainel/shared/ui`): **Geral** | **Whitelabel** | **Módulos** | **Pessoas colaboradoras** | **Financeiro**. Financeiro apenas visível quando `profiles.role = super_admin` no admin.

**Implementação actual (scroll único):** em `painel/concessionarias/[id]/editar`, formulário único financeiro («Cobrança comercial SaaS») desduplica vista: plano efetivo (catálogo + legado), estado de cobrança, período contractual, dígitos de mensalidades e histórico com upload de PDF/imagens aos registos (`saveDealershipCommercialFinanceAction`, anexos com `dealership-operator-billing`). Migrações: hub `20260508100000` + `20260508103000_dealership_billing_contract_attachments.sql`. Forms com ficheiro usam `onSubmit` + `FormData` (evitar `encType` em `<form>` com hidratação React 19) e `experimental.serverActions.bodySizeLimit`=`30mb` em `apps/admin-master/next.config.ts`.

**CNPJ opcional (`public.dealerships.cnpj`):** migração de reparação `supabase/migrations/20260508153000_dealerships_ensure_cnpj_column.sql` (coluna nullable + índice único parcial). Em `createDealershipAction` (`apps/admin-master/src/actions/dealerships.ts`), a propriedade `cnpj` só entra no `insert` quando há exatamente 14 dígitos — sem `cnpj: null`, evita falha «schema cache» em bases onde a coluna ainda não estava aplicada ao guardar concessionária sem CNPJ.

**Colunas whitelabel (`theme_config`, `content_config`, `enabled_features`):** migração de reparação `supabase/migrations/20260508203000_dealerships_ensure_theme_content_enabled_columns.sql` quando o remoto nunca aplicou `20260423120000_admin_rbac_theme_leads.sql` — evita erro PostgREST «Could not find the 'content_config' column… in the schema cache» ao criar concessionárias.

**Convite colaboradores / login painel da loja:** `apps/admin-master/src/actions/dealership-collaborators.ts` — `inviteDealershipCollaboratorAction` usa `auth.admin.createUser` ou, se o e-mail já existe no Auth, associa `profiles` à concessionária (recusa `super_admin` ou e-mail já ligado a outra loja). Para envio automático de e‑mail de recuperação quando se liga conta existente: `NEXT_PUBLIC_DEALERSHIP_AUTH_REDIRECT_ORIGIN` + Redirect URLs no Supabase. No `dealership-panel`: rotas `/recuperar-senha`, `/auth/confirm` (código PKCE), `/definir-senha`. Quem não tem `profiles` para o tenant continua bloqueado (`requireDashboardSession` → `/erro/concessionaria`).

**Hardening segurança Supabase (Advisor):** `supabase/migrations/20260508164500_security_advisor_hardening.sql` — remove policy de listagem no bucket público `dealership-branding`, move `current_profile_*` para schema `private` (não exposto no REST por defeito), políticas explícitas «deny» em `dealership_meta_credentials` / `dealership_classifieds_credentials`, trigger `dealerships_block_tenant_plan_feature_updates` em `SECURITY INVOKER`, revoga `anon` em `disconnect_dealership_meta_connection`. **`supabase/migrations/20260508201500_rpc_security_invoker_wrappers.sql`:** RPC de vitrine/dashboard (`effective_feature_keys_*`, resolução de host/slug, `get_public_vehicle_by_id`, `disconnect_meta`) — wrappers `SECURITY INVOKER` em `public` e implementação em `private.*_impl` para o Advisor deixar de marcar DEFINER nas entradas expostas. Proteção de passwords vazadas (HIBP): ativar no Dashboard **Authentication** conforme `packages/shared/docs/SUPABASE_TYPES.md`.

#### Middleware / sessão dashboard

- **`requireDashboardSession`** (painel): valida sessão Auth + tenant por cookie/host. Perfis vinculados à loja continuam a exigir `profiles.dealership_id = cookie tenant`; perfis `super_admin` passam a operar em qualquer concessionária resolvida pelo host (permissão máxima operacional no `dealership-panel`), mantendo o tenant efetivo no `cookieDealershipId`. Depois da validação, ler `dealerships.status`; se **`status <> 'active'`** ⇒ `redirect('/conta-inativa')`.
- Página **`/conta-inativa`**: texto em PT («Conta inativa ou suspensa…»); fora do layout `/painel` para evitar ciclo.

#### Prompts de execução detalhados (Passo C — tickets)

1. **Admin-tabs:** refactor `DealershipForm` ou wrapper com `Tabs` + rotas paralelas opcionais; extrair formulário «Geral» existente para tab 1.
2. **Lista de perfis:** `select` filtrando `profiles.dealership_id = id` da URL; mascarar e‑mail; convite Auth (Edge existente ou `provision-dealership-user`) com default `seller`.
3. **Financeiro:** formulário `dealership_billing` + tabela (`Data Table`) para histórico; mutações gravadas com entrada em auditoria (`platform_audit_logs`) na mesma acção servidor ou RPC transaccional.
4. **Export:** route handler CSV `application/csv` com `super_admin` + `id` concessionária; sem PII excessiva.

#### QA obrigatório (Passo D)

1. `seller`: não consegue `select`/`update` sobre `dealership_billing`/histórico (bloqueado por RLS) — regressão garantida apenas após migrações aplicadas.
2. `owner`/`manager`: vê todas as linhas `leads` do tenant conforme migrações; `seller`: só linhas `assigned`.
3. Loja `suspended`: host público sem id ativo na vitrine; painel ⇒ `/conta-inativa`.
4. `pending_setup`: no MVP scaffold, igual a não ativo no painel — validar decisão PRD antes de soften.
5. Audit: alteração manual de montante mensal ⇒ linha nova em `platform_audit_logs`.

---

### Kit redes sociais (Meta — IG + FB) — arquitetura alvo (após PRD de 2026-05-07)

| Campo | Valor |
| --- | --- |
| **Módulo** | `social_media_kit` |
| **Status técnico** | Passo C inicial concluído no repositório: OAuth popup + migrações + RPC desconectar; Sharp/worker/UI veículo pendentes |
| **Superfícies** | `dealership-panel`, Supabase Storage, Edge Functions (OAuth + worker), Postgres (jobs + audit) |

#### UX/UI (Passo B — spec para implementação)

1. **Conexões (Meta)**  
   Card com estado: `Disconnected` | `Connecting` | `Connected` | `Error` | `Reconnect required`.  
   CTA único para abrir OAuth; listar **Page name** / **Instagram @** apenas após ligar (campos mascarados, sem tokens).

2. **Formulário de veículo (finalização)**  
   Bloco opcional só com módulo ativo: dois checkboxes (IG Feed, FB Page), pré-seleccionados desmarcados conforme política de produto.  
   Primário principal: **«Guardar veículo»**; quando qualquer checkbox activo ⇒ label secundário ou modo **«Guardar e enviar redes»** conforme UX (evitar desfazer já guardado por falha só de rede).

3. **Feedback de job**  
   Toast ou inline no registo mais recente: `Queued` → `Generating assets` → `Publishing to Meta` → `Published` ou `Failed` (+ link para “Ver histórico de publicações”).

#### Fluxo técnico resumido (Graph API — sujeito ao doc Meta atual)

Pipeline assíncrono por canal (Instagram / Facebook pode ser dois sub-jobs sob o mesmo `social_publication_job`):

| Passo | Atividade |
| --- | --- |
| 1 | Worker lê tokens cifrados (service role); refresh se próximo ao vencimento / após erro renovável |
| 2 | **Render** série de raster 1080×1080 (`sharp`, ver nota infra) usando branding dinâmico + template (`classic \| performance \| tech`) |
| 3 | Upload binário temporário ao **Supabase Storage** (bucket tenant-scoped ou path por `dealership_id`) ou URL pública assinado curto suficiente para Graph |
| 4 | **Instagram:** criar `media`/`children` carousel conforme fluxo carousel container → `publish`; armazenar `ig_media_id` / permalink se devolvido |
| 5 | **Facebook:** publicar foto(s) álbum/carrossel via endpoint de Page sob Graph v19+ conforme permissões efectivas |
| 6 | Persistir resultado + limpar blobs temporários; atualizar estado do job |

**Nota `sharp` + Edge Functions:** bundles Deno grandes; em Passo C o squad escolhe (a) `npm:sharp` na Edge sob controlo de tamanho, (b) **Route Handler Next** apenas para enqueue + render offload, ou (c) worker futuro ligado ao mesmo Postgres queue. Registrar decisão na migração / ADR quando fechar PoC.

#### Modelo de dados sugerido (novas tabelas — Passo C)

1. `dealership_meta_connections` — estado agregado: `dealership_id`, `status`, `page_id`, `ig_user_id`, `token_reference` (FK lógico), `last_error`, `connected_at`.

2. `dealership_meta_credentials` — apenas service role / função definer: `connection_id`, `access_token_encrypted`, `expires_at`.

3. `dealership_meta_oauth_sessions` — `state`, `code_verifier`?, `redirect_origin`, `expires_at` (idem padrão classificados).

4. `social_publication_jobs` — `dealership_id`, `vehicle_id`, `channels` (`ig`/`fb`), `artifact_template`, `payload_snapshot`, status machine (`queued` → `rendering` → `uploading_meta` → `published`/`failed_partial`/`failed`), `attempt_count`, `next_retry_at`, `error_channel`, `error_detail` (mensagem sanitizada ao UI).

RLS parallelo ao módulo `classifieds_sync`: tenant lê apenas metadados da própria loja; credenciais zero policies para JWT tenant.

#### Edge Functions / cron

| Função | Papel |
| --- | --- |
| `meta-oauth-callback` | Troca código, converte para long-lived, grava credential, HTML `postMessage` + close |
| `social-publication-worker` | Invocable por cron (`pg_net`/`pg_cron` a cada minute) ou `supabase/functions` schedule: processa próximo job `queued` com lock pessimista |

#### Prompts de execução detalhados (Passo C — para copiar a tickets)

1. Migração: tabelas + RLS + índices `(dealership_id, status, created_at)` em jobs.

2. Next: popup starter `POST /api/.../meta/oauth/start` + listener `postMessage` (reuse pattern integrações classifieds).

3. Edge callback `meta-oauth-callback` + segredo **`META_TOKENS_CRYPTO_SECRET`** (Edge) e credenciais de app (**`META_APP_CLIENT_ID`**, **`META_APP_CLIENT_SECRET`**).

#### Passo C — entrega inicial OAuth + schema (repo, 2026-05-07)

| Artefacto | Caminho |
| --- | --- |
| Migração | `supabase/migrations/20260507140000_social_media_meta_oauth_scaffold.sql` |
| Callback Edge | `supabase/functions/meta-oauth-callback/index.ts` |
| Start OAuth Next | `apps/dealership-panel/src/app/api/painel/integracoes/meta/oauth/start/route.ts` |
| UI Conexões | `apps/dealership-panel/src/components/integrations/social-meta-integration-card.tsx` + agrupamento em `apps/dealership-panel/src/app/painel/integracoes/page.tsx` |
| RPC desconectar | `public.disconnect_dealership_meta_connection()` (JWT tenant) |
| App Meta por concessionária | `20260508231000_dealership_meta_oauth_apps.sql`; `integracoes/actions.ts`, `meta-developer-app-form.tsx`, `resolve-meta-oauth-start.ts`; Edge `meta-oauth-callback` lê BD primeiro |

Secrets Edge: **`META_TOKENS_CRYPTO_SECRET`** (cifra tokens de sessão + **App Secret** em `dealership_meta_oauth_apps`); **`META_APP_CLIENT_ID` / `META_APP_CLIENT_SECRET`** **opcionais** em produção (fallback dev quando não há linha na tabela). **`META_OAUTH_REDIRECT_URI`**, **`META_GRAPH_API_VERSION`**, **`META_OAUTH_SCOPES`** opcionais. Em produção, o painel grava **App ID** e **App Secret** da app **da concessionária** (`migração 20260508231000`). Redirect:`NEXT_PUBLIC_SUPABASE_URL` + `/functions/v1/meta-oauth-callback` registado na app Meta do cliente. **URLs OAuth / Graph:** validar sempre com a documentação oficial Meta.

4. Módulo render: resolver package `packages/shared` ou servidor edge com entrada `{ vehicle photos, dealership logo rgb, theme: classic|performance|tech }` → PNG bytes.

5. Worker: estado idempotente; para IG carousel, registar cada `creation_id` intermédio em `social_publication_jobs.step_payload` para permitir retomada manual após falha no slide k/N.

#### QA obrigatório (Passo D)

1. OAuth: sucesso, denegação de permissão, `state` adulterado, token revogado no Business Manager externo.

2. Post: carrossel IG min 2/max N imagens válidas; FB página sem permissão `pages_manage_posts` ⇒ erro claro canal FB apenas.

3. Falha parcial: simular erro Graph no 2º filho carousel — job marca `failed_partial` IG; permite **retry** apenas IG sem duplicar veículo; sem prometer atomicidade Meta.

---

### Integração com classificados (OLX & WebMotors) — arquitetura alvo (após PRD de 2026-05-06)

| Campo | Valor |
| --- | --- |
| **Módulo** | `classifieds_sync` |
| **Status técnico** | Refinamento concluído para execução (OAuth2 popup, storage seguro, publicação/baixa) |
| **Superfícies** | `dealership-panel`, Supabase (`public` + RLS), Edge Functions (`supabase/functions`) |

#### UX/UI refinado (fluxo non-technical por clique)

Referência de componentes/blocos consultados no MCP `user-shadcn`:
- `card` (cards de portal e status)
- `dialog` (estado de ajuda/erro/reconexão)
- `tabs` (filtros por provedor e histórico)

Composição recomendada da página `/painel/integracoes`:
1. **Cards por portal (OLX/WebMotors):** status atual, último sync, botões de ação.
2. **Botão principal por card:** `Conectar`, `Reconectar`, `Conectado` (desabilitado) conforme estado.
3. **Feedback em tempo real:** badge de status (`desconectado`, `conectando`, `conectado`, `erro`).
4. **Ações operacionais:** publicar agora (manual) e histórico de eventos (sucesso/falha).
5. **Fluxo popup:** após autorização bem-sucedida, popup fecha automaticamente e o card atualiza sem reload completo.

#### Arquitetura API-first (OAuth2 popup + sync)

**Contrato funcional recomendado:**

1. `startClassifiedsOAuthConnection(input)`
   - **input:** `{ provider: "olx" | "webmotors" }`
   - **output:** `{ popupAuthorizationUrl, state, codeVerifierRef }`
   - **responsabilidade:** criar `state`/PKCE, persistir sessão OAuth pendente por tenant.

2. `handleClassifiedsOAuthCallback(request)` (Edge Function)
   - **input:** callback com `code`/`state` do provedor.
   - **output:** HTML mínimo com script `window.opener.postMessage(...)` + `window.close()`.
   - **responsabilidade:** trocar `code` por tokens, salvar credenciais criptografadas, marcar conexão ativa.

3. `publishVehicleToClassifieds(input)`
   - **input:** `{ vehicleId, providers?: ("olx" | "webmotors")[] }`
   - **output:** resultado por provedor (`queued`/`published`/`error`).

4. `delistVehicleFromClassifieds(input)`
   - **input:** `{ vehicleId, reason: "sold" | "inactive" | "manual" }`
   - **output:** resultado por provedor.

#### Modelo de dados e segurança (RLS estrito + criptografia)

**Separação recomendada:**

1. `public.dealership_classifieds_connections` (metadados não sensíveis)
   - `id`, `dealership_id`, `provider`, `status`, `external_account_id`, `token_expires_at`, `last_sync_at`, `last_error`, `connected_at`, `updated_at`.
   - `unique (dealership_id, provider)`.

2. `public.dealership_classifieds_credentials` (sensível)
   - `connection_id`, `dealership_id`, `provider`, `access_token_encrypted`, `refresh_token_encrypted`, `scope`, `expires_at`, `updated_at`.
   - acesso restrito a `service_role` + funções `security definer` dedicadas.

3. `public.classifieds_sync_jobs` (fila de publicação/baixa)
   - `dealership_id`, `vehicle_id`, `provider`, `action`, `status`, `attempt_count`, `next_retry_at`, `payload`, `result_payload`.

**Regras de segurança:**
- Tenant (`authenticated`) só lê metadados da própria loja; nunca lê ciphertext bruto.
- Escrita de credenciais ocorre apenas por função segura chamada pela Edge Function de callback.
- Todas as queries operacionais filtradas por `dealership_id` da sessão (`requireDashboardSession`).

#### Edge Functions previstas

1. `classifieds-oauth-callback`
   - Recebe callback do provedor.
   - Valida `state`, troca token, persiste credenciais seguras e envia mensagem para janela de origem.

2. `classifieds-sync-dispatch`
   - Worker para processar fila de `publish`/`delist` com retry/backoff.

3. `classifieds-refresh-token`
   - Rotina de refresh sob demanda ou agendada para conexões próximas do vencimento.

#### Fluxo popup seguro no frontend

1. Usuário clica “Conectar [Portal]”.
2. Frontend chama `startClassifiedsOAuthConnection` para obter URL oficial de autorização.
3. Frontend abre popup com `noopener,noreferrer,width,height`.
4. Janela principal escuta `window.postMessage` com `origin` validado.
5. Callback da Edge Function responde HTML que envia `postMessage` (`success`/`error`) e fecha popup.
6. Página de integrações faz refresh dos dados e atualiza badge/botões.

#### Debate técnico (Architect + Backend + Frontend)

| Tema | Opção escolhida | Justificativa |
| --- | --- | --- |
| OAuth2 UX | Popup com callback auto-close | Menor fricção para lojista e sem cópia manual de credenciais |
| Armazenamento de token | Tabela sensível separada + criptografia + função segura | Reduz superfície de vazamento no app tenant |
| Execução de publish/delist | Fila assíncrona (`classifieds_sync_jobs`) | Resiliência com retry e desacoplamento da UI |
| Renovação de token | Worker/funcão dedicada de refresh | Evita falha de publicação por expiração silenciosa |

#### Prompts técnicos detalhados (Passo C)

1. **Supabase schema + RLS:**
   - Criar migração para `dealership_classifieds_connections`, `dealership_classifieds_credentials`, `classifieds_sync_jobs`.
   - Aplicar RLS estrito por tenant nos metadados e bloquear leitura de credenciais para `authenticated`.
   - Criar funções `security definer` para `upsert` seguro de credenciais e leitura operacional controlada.

2. **Edge Function callback OAuth2:**
   - Implementar `classifieds-oauth-callback` com validação de `state` e troca de token por provedor.
   - Persistir tokens via função segura e retornar HTML com `postMessage + close`.
   - Tratar cenários de erro (consent denied, code inválido, provider timeout).

3. **Dealership-panel backend actions:**
   - Implementar `startClassifiedsOAuthConnection`, `getClassifiedsConnectionStatus`, `disconnectClassifiedsConnection`.
   - Implementar ações de `publish`/`delist` que enfileiram jobs por provedor.

4. **Dealership-panel frontend (popup control):**
   - Criar página `/painel/integracoes` com cards OLX/WebMotors.
   - Implementar abertura de popup segura, listener de `message`, timeout de popup e fallback de erro amigável.
   - Renderizar estados de botão/status com feedback imediato.

5. **Worker de sync + refresh:**
   - Processar `classifieds_sync_jobs` com retry/backoff e idempotência por `vehicle_id + provider + action`.
   - Executar refresh token automático antes de publicar/baixar quando necessário.

6. **Auditoria e observabilidade:**
   - Registrar eventos por tenant (`oauth_started`, `oauth_connected`, `oauth_denied`, `publish_ok`, `publish_error`, `delist_ok`, `refresh_error`).
   - Expor histórico resumido na UI de integrações sem dados sensíveis.

#### QA — cenários obrigatórios do módulo de Integrações

1. **Fluxo feliz OAuth2:** conectar OLX e WebMotors via popup e fechar automaticamente com status `conectado`.
2. **Recusa de consentimento:** popup retorna erro e UI mostra estado recuperável.
3. **Refresh expirado:** tentativa de sync falha com `erro_reautenticacao` e CTA de reconexão.
4. **Publicação + baixa:** veículo publicado no portal e removido automaticamente após venda.
5. **RLS crítico:** loja A não acessa credenciais, jobs nem metadados da loja B.
6. **Segurança de popup:** aceitar apenas `postMessage` de origem esperada.
7. **Resiliência:** falha temporária do portal entra em retry sem perder job.

#### Passo C — implementação inicial do módulo Integrações (2026-05-07)

| Item | Entrega |
| --- | --- |
| **Migração app OAuth por loja** | `supabase/migrations/20260508220000_dealership_classifieds_oauth_apps.sql` + `dealership-panel` `resolve-classifieds-oauth-config.ts` (merge com `.env`) + Edge `classifieds-oauth-callback` resolve em runtime (`decrypt` em `classifieds-crypto`). |
| **Migração** | `supabase/migrations/20260507123000_classifieds_sync_oauth_scaffold.sql` com tabelas de conexão/credencial/sessão/jobs, RLS tenant-safe e seed de `classifieds_sync` em planos premium. |
| **Frontend painel** | Nova página `apps/dealership-panel/src/app/painel/integracoes/page.tsx` e componente client `classifieds-integration-cards.tsx` com fluxo popup e atualização de status. |
| **API start OAuth** | `apps/dealership-panel/src/app/api/painel/integracoes/oauth/start/route.ts` para iniciar sessão OAuth2, gerar `state`/PKCE e montar URL de autorização oficial por provedor. |
| **Edge callback OAuth** | `supabase/functions/classifieds-oauth-callback/index.ts` para troca de `code`, persistência de credenciais cifradas e resposta HTML com `postMessage + window.close()`. |
| **Criptografia tokens** | Helper `supabase/functions/_shared/classifieds-crypto.ts` com cifra AES-GCM antes de persistir `access_token`/`refresh_token`. |
| **Navegação painel** | Link “Integrações” adicionado ao shell do `dealership-panel`. |

#### Passo C — execução operacional (2026-05-07)

| Item | Resultado |
| --- | --- |
| Aplicação de migração no remoto | ✅ `20260507123000_classifieds_sync_oauth_scaffold.sql` aplicada (paridade local/remoto confirmada). |
| Deploy Edge Function callback | ✅ `classifieds-oauth-callback` publicada no projeto Supabase. |
| Estrutura e políticas | ✅ Tabelas `dealership_classifieds_*` e `classifieds_sync_jobs` existentes com políticas RLS de isolamento por tenant. |
| Secrets OAuth2 de provedor | ⚠️ Pendente configurar (`OLX_OAUTH_*`, `WEBMOTORS_OAUTH_*`, `CLASSIFIEDS_TOKENS_CRYPTO_SECRET`). |

#### Passo D — playbook QA E2E (Integrações OLX/WebMotors)

1. **Pré-check de ambiente**
   - Confirmar no Supabase (secrets) os nomes obrigatórios:
     - `OLX_OAUTH_AUTHORIZATION_URL`, `OLX_OAUTH_TOKEN_URL`, `OLX_OAUTH_CLIENT_ID`, `OLX_OAUTH_CLIENT_SECRET`
     - `WEBMOTORS_OAUTH_AUTHORIZATION_URL`, `WEBMOTORS_OAUTH_TOKEN_URL`, `WEBMOTORS_OAUTH_CLIENT_ID`, `WEBMOTORS_OAUTH_CLIENT_SECRET`
     - `CLASSIFIEDS_TOKENS_CRYPTO_SECRET`
   - Fluxo recomendado para setar secrets:
     1) copiar `supabase/.env.classifieds.secrets.example` para `supabase/.env.classifieds.secrets.local`;
     2) preencher valores reais;
     3) executar `supabase secrets set --env-file supabase/.env.classifieds.secrets.local`.
   - Confirmar `classifieds-oauth-callback` deployed.

2. **Fluxo feliz de conexão por popup (cada provedor)**
   - Login no `dealership-panel` de um tenant com `classifieds_sync` ativo.
   - Abrir `/painel/integracoes`.
   - Clicar `Conectar OLX` (e depois `Conectar WebMotors`), concluir consentimento no popup.
   - Verificar:
     - popup fecha automaticamente;
     - card volta com status `Conectado`;
     - `last_error` vazio.

3. **Fluxo de recusa de consentimento**
   - Repetir conexão e recusar permissões no portal.
   - Verificar:
     - status do card vira `Erro`;
     - mensagem amigável é exibida;
     - sessão OAuth marcada como erro.

4. **Fluxo token expirado / refresh inválido**
   - Simular credencial expirada (ajustar `expires_at` para passado e/ou refresh inválido no ambiente de homologação).
   - Disparar ação de sync (publish/delist em job).
   - Verificar:
     - status em conexão muda para `reauth_required` ou `error`;
     - UI exibe ação `Reconectar`;
     - falha registrada em `classifieds_sync_jobs.last_error`.

5. **SQL checks de isolamento (RLS crítico A/B)**
   - Como usuário autenticado da loja A, validar que não retorna linhas da loja B:
     - `dealership_classifieds_connections`
     - `dealership_classifieds_oauth_sessions`
     - `classifieds_sync_jobs`
   - Verificar que `dealership_classifieds_credentials` não é legível por JWT tenant.

6. **SQL rápido de auditoria (operação)**
   - Conferir conexões por loja/provedor:
     - `select dealership_id, provider, status, token_expires_at, last_error from public.dealership_classifieds_connections order by updated_at desc;`
   - Conferir sessões OAuth recentes:
     - `select provider, status, error_reason, created_at, consumed_at from public.dealership_classifieds_oauth_sessions order by created_at desc limit 20;`
   - Conferir fila de sync:
     - `select provider, action, status, attempt_count, last_error, created_at from public.classifieds_sync_jobs order by created_at desc limit 50;`

---

### Métricas avançadas — arquitetura alvo (após PRD de 2026-05-06)

| Campo | Valor |
| --- | --- |
| **Módulo** | `advanced_metrics` |
| **Status técnico** | Refinamento concluído para execução (backend + frontend + telemetria + QA) |
| **Superfícies** | `dealership-panel`, `customer-site`, `packages/shared`, Supabase (`vehicles`, `leads`, eventos de views) |

#### UX/UI refinado (com base em shadcn MCP)

Referência de componentes/blocos consultados no MCP `user-shadcn`:
- `card`, `tabs`
- `chart` + exemplos `chart-bar-demo`, `chart-area-step`, `tabs-demo`

Composição recomendada do dashboard:
1. **Linha 1 (cards KPI):** 3 cards com total ativos, valor de estoque e aging médio.
2. **Linha 2 (gráficos):**
   - gráfico de barras para leads no período vs período anterior,
   - gráfico de área (step) para tendência diária/semanal de leads.
3. **Linha 3:**
   - card com distribuição por origem (`contact`/`simulation`),
   - tabela compacta Top 5 veículos mais visualizados.
4. **Tabs de janela temporal:** `7d`, `30d`, `90d`.

#### Arquitetura API-first

**Contratos server-side sugeridos no `dealership-panel`:**

1. `getAdvancedMetricsSnapshot(input)`
   - **input:** `{ rangeDays: 7 | 30 | 90 }`
   - **output:** snapshot consolidado com KPIs de estoque, leads e top views.
2. `recordVehicleViewEvent(input)` (consumido no `customer-site`)
   - **input:** `{ dealershipId, vehicleId, viewedAt, source }`
   - Implementação assíncrona/não bloqueante.

#### Cálculo de Stock Aging (eficiência)

- Fórmula base no MVP:
  - `aging_days = current_date - created_at::date` por veículo `available`.
  - `avg_stock_aging_days = avg(aging_days)` da concessionária.
- Otimização:
  - índice composto em `vehicles(dealership_id, status, created_at)`.
  - agregação por query SQL direta no MVP; materialized view como evolução se carga crescer.

#### Contagem de views no customer-site (fidedigna e performática)

Recomendação MVP:
1. Criar tabela de eventos agregáveis (`vehicle_view_events`) com `dealership_id`, `vehicle_id`, `viewed_at`.
2. Na página de detalhe do veículo (`customer-site`), disparar registro de view de forma server-side/non-blocking.
3. Deduplicação leve por sessão/timebox (ex.: 1 evento por veículo por sessão em janela curta) para evitar ruído.
4. Dashboard lê agregação por período com `group by vehicle_id`.

Evolução opcional:
- Materialized view diária para reduzir custo em períodos longos.
- Edge Function dedicada se throughput de views crescer significativamente.

#### Debate técnico (Backend + Frontend)

| Tema | Opção MVP | Justificativa |
| --- | --- | --- |
| Agregação de métricas | SQL server-side por tenant | Menor complexidade inicial e alinhado ao RLS existente |
| Views de vitrine | Registro de evento server-side | Evita depender de frontend puro e melhora confiabilidade |
| Visualização | shadcn `card` + `chart` + `tabs` | Coerência com design system e legibilidade operacional |
| Janela temporal | `7d/30d/90d` | Simplicidade para decisão rápida do gestor |

#### Prompts técnicos detalhados (Passo C)

1. **Supabase (dados de métricas):**
   - Criar migração para tabela de views de veículos e índices por tenant/período.
   - Criar função SQL/RPC para snapshot de métricas por `dealership_id` e faixa temporal.
2. **Shared (tipos):**
   - Adicionar tipos `AdvancedMetricsSnapshot`, `LeadOriginBreakdown`, `TopViewedVehicle`.
3. **Customer-site (telemetria de views):**
   - No detalhe do veículo, registrar evento de view sem impactar TTFB.
4. **Dealership-panel backend:**
   - Criar data loader seguro (`requireDashboardSession`) para buscar snapshot e validar gating.
5. **Dealership-panel frontend:**
   - Implementar dashboard com cards + charts + tabs e estados de loading/erro parcial.
6. **Feature flag premium:**
   - Exibir dashboard apenas com `advanced_metrics` ativo nas chaves efetivas.

#### QA — cenários obrigatórios do módulo Métricas

1. **RLS crítico:** usuário da loja A não vê métricas da loja B.
2. **Precisão de estoque:** total ativo e valor total conferem com consulta SQL da loja.
3. **Precisão aging:** média de dias bate com amostra controlada de veículos.
4. **Leads por origem:** soma de `contact + simulation` igual ao total de leads.
5. **Comparativo temporal:** período anterior equivalente retorna variação correta.
6. **Top 5 views:** ranking ordenado por visualizações da própria loja.
7. **Responsividade:** cards e gráficos sem quebra em resoluções desktop/tablet.

#### Passo C — implementação do módulo Métricas (2026-05-06)

| Item | Entrega |
| --- | --- |
| **Migração** | `supabase/migrations/20260506183000_advanced_metrics_vehicle_views.sql` (tabela `vehicle_view_events`, índices, RLS e grants, além do vínculo `advanced_metrics` em planos premium). |
| **Customer-site** | Registro de evento de visualização de veículo em `apps/customer-site/src/app/(storefront)/veiculo/[slug]/page.tsx` com insert em `vehicle_view_events`. |
| **Dealership-panel** | Dashboard atualizado em `apps/dealership-panel/src/app/painel/page.tsx` com gating `advanced_metrics`, janelas `7/30/90`, comparativo do período anterior, origem de leads e Top 5 veículos por views. |
| **Pricing/feature docs** | `packages/shared/docs/PRD_DYNAMIC_PRICING_PLANS_AND_MODULES.md` atualizado com vínculo premium de `advanced_metrics`. |

#### Passo C — observação operacional

- A migração foi adicionada no repositório, mas a aplicação no ambiente Supabase remoto/local deve seguir o fluxo operacional da equipe (CLI/dashboard) antes de validar o dashboard com dados reais.

#### Passo D — QA executado do módulo Métricas (2026-05-06)

| Cenário | Resultado | Evidência |
| --- | --- | --- |
| Vínculo premium de feature flag | ✅ Aprovado | `business` e `enterprise` retornam `advanced_metrics` no catálogo efetivo de módulos; `starter` não inclui o módulo. |
| RLS de eventos de views | ✅ Aprovado | Usuário A vê apenas 2 eventos da loja A; usuário B vê apenas 3 eventos da loja B (`other_events = 0` em ambos). |
| Inserção pública de views | ✅ Aprovado | Inserções `anon` em `vehicle_view_events` aceitas para veículos públicos válidos (A=2, B=3 em 30d). |
| Precisão matemática (tenant B, 30d) | ✅ Aprovado | Snapshot SQL: `available_vehicles=1`, `inventory_value=129900.00`, `avg_stock_aging_days=0.00`, `leads_30d=1`, `leads_simulation_30d=1`, `top_vehicle_views=3`. |
| Gating no tenant A | ✅ Aprovado | `effective_modules` do usuário A mantém apenas `[finance_simulator]` (sem `advanced_metrics`). |
| Responsividade visual dos gráficos | ⚠️ Pendente validação manual | Requer sessão autenticada no browser para validação em resoluções reais (desktop/tablet). |

#### Passo D — checklist manual pendente (encerramento)

1. Login no `dealership-panel` como tenant com `advanced_metrics` ativo (ex.: loja B).
2. Validar layout em desktop e tablet (cards, barras de tendência e top views sem sobreposição).
3. Confirmar estados de fallback/erro parcial quando uma fonte de dados falhar.

#### Follow-up técnico para destravar QA visual (2026-05-06)

Durante a execução assistida do QA visual, foram identificados e corrigidos dois bloqueios de infraestrutura que impactavam navegação por tenant em dev:

| Item | Status | Evidência técnica |
| --- | --- | --- |
| Trigger legado em `dealerships` referenciando coluna removida `enabled_features` | ✅ Corrigido | Migração `supabase/migrations/20260506183500_fix_dealership_trigger_removed_enabled_features.sql`. |
| RPC de resolução por slug sem grant para `anon/authenticated` | ✅ Corrigido | Migração `supabase/migrations/20260506184000_grant_public_dealership_slug_rpc.sql` + validação SQL com `set local role anon`. |

Observações operacionais do follow-up:
- `DEVELOPMENT_TENANT_SLUG=qa-finance-b` foi sincronizado em ambiente local para estabilizar o fluxo de tenant em `localhost`.
- Usuário QA autenticável criado e vinculado ao tenant B para retomar checklist visual pendente.
- Paridade de migrações local/remoto confirmada via `supabase migration list` (inclui `20260506183500`, `20260506184000` e `20260507114500` aplicadas no remoto).

---

### Gerador de QR Code para veículos — arquitetura alvo (após PRD de 2026-05-06)

| Campo | Valor |
| --- | --- |
| **Módulo** | `qr_generator` |
| **Status técnico** | Refinamento concluído para execução (backend + frontend + print + QA) |
| **Superfícies** | `dealership-panel`, `customer-site`, `packages/shared`, Supabase (`vehicles`, `dealerships`, RLS) |

#### UX refinado — lâmina de venda / etiqueta

1. **Entrada:** ação “Gerar QR Code” na linha do veículo na tabela de estoque.
2. **Modal/Drawer de preview:** exibe lâmina pronta para impressão com:
   - QR central em alto contraste
   - logo no topo
   - marca/modelo/ano/preço em bloco resumido
   - CTA “Escaneie para ver detalhes e simular financiamento”
3. **Formatos de impressão:**
   - **A4:** 1 lâmina por página (foco showroom e negociação de mesa).
   - **Etiqueta compacta:** bloco reduzido com QR dominante e dados essenciais.
4. **Princípios visuais:** whitelabel sutil (cores da loja em títulos/linhas), sem prejudicar contraste do QR.
5. **Estados:** carregando QR, pronto para imprimir, erro de geração.

#### Arquitetura API-first (veredito)

**Decisão de implementação no MVP:** geração do QR no frontend (`dealership-panel`) com lib confiável, e resolução da URL canônica em camada server-side autenticada.

Motivação:
- Não há segredo no payload QR (URL pública), então Edge Function dedicada não é obrigatória no MVP.
- Menor latência e menor complexidade operacional para preview/impressão instantânea.
- Segurança permanece no backend ao montar payload apenas para veículo do tenant autenticado.

#### Contrato técnico sugerido

- **Command server-side:** `getVehicleQrPrintPayload(vehicleId)`
- **Input:** `vehicleId`
- **Output mínimo:**
  - `dealershipId`
  - `vehicleId`
  - `publicVehicleUrl`
  - `dealershipLogoUrl`
  - `dealershipPrimaryColor` (opcional)
  - `vehicleLabel` (marca/modelo/ano)
  - `vehiclePriceFormatted`
  - `ctaText`
- **Regras técnicas:**
  - Validar sessão autenticada do painel da concessionária.
  - Buscar veículo por tenant (RLS/where dealership_id).
  - Resolver domínio final:
    - `custom_domain` quando preenchido
    - fallback para host padrão da plataforma com slug.
  - Retornar erro estruturado se veículo fora do tenant ou indisponível.

#### Debate técnico (Backend + Frontend)

| Tema | Opção escolhida | Justificativa |
| --- | --- | --- |
| Geração QR | Frontend (lib `qrcode`) | Tempo de resposta imediato no preview, sem roundtrip extra para imagem |
| Resolução URL | Server Action autenticada | Evita montagem incorreta de domínio e reforça tenant boundary |
| Impressão | CSS `@media print` + janela/layout dedicado | Compatível com navegadores desktop comuns |
| Persistência | Sem nova tabela no MVP | Funcionalidade operacional, sem necessidade de histórico inicial |

#### Prompts técnicos detalhados (Passo C)

1. **Shared (URL/campos de impressão):**
   - Criar helper para montar URL pública canônica do veículo por tenant.
   - Exportar interface `VehicleQrPrintPayload` em `packages/shared/src/types`.
2. **Dealership-panel backend (server action):**
   - Implementar `getVehicleQrPrintPayload(vehicleId)` com sessão autenticada.
   - Garantir filtro por `dealership_id` e `status = 'available'`.
   - Resolver domínio final por `custom_domain` vs fallback.
3. **Dealership-panel frontend (estoque):**
   - Adicionar botão “Gerar QR Code” em cada linha da tabela de veículos.
   - Abrir modal com preview da lâmina.
   - Gerar QR em client-side a partir de `publicVehicleUrl`.
4. **Print layout:**
   - Implementar componente de lâmina com variante `a4` e `etiqueta`.
   - Garantir CSS print sem elementos de navegação do painel.
5. **Gating de módulo:**
   - Reutilizar chaves efetivas e esconder ação quando `qr_generator` não habilitado.

#### QA — cenários obrigatórios do módulo QR

1. **Escaneabilidade:** QR escaneia em Android/iOS e abre URL correta do veículo.
2. **Domínio correto:** com e sem `custom_domain` o URL final segue regra canônica.
3. **Isolamento RLS:** usuário da loja A não gera payload para veículo da loja B.
4. **Impressão:** A4 e etiqueta legíveis em Chrome e Edge.
5. **Gating:** sem `qr_generator`, botão não aparece na tabela.
6. **Erro controlado:** payload inválido/veículo ausente mostra mensagem amigável.

#### Passo C — implementação do módulo QR (2026-05-06)

| Item | Entrega |
| --- | --- |
| **Shared** | Novo helper `packages/shared/src/lib/dealership-public-url.ts` para URL pública canônica do veículo, com export no pacote shared. |
| **Dependência** | `qrcode` adicionado em `@autopainel/dealership-panel` para geração do QR. |
| **Backend painel** | `getVehicleQrPrintPayload(vehicleId)` em `apps/dealership-panel/src/lib/inventory/get-vehicle-qr-print-payload.ts` com validação tenant + gating `qr_generator`. |
| **Frontend estoque** | Botão “Gerar QR Code” adicionado em `VehicleInventoryTable` (desktop/mobile) apenas para veículo `available` e módulo habilitado. |
| **Tela de impressão** | Página `apps/dealership-panel/src/app/painel/estoque/[vehicleId]/qr/page.tsx` com preview, alternância A4/etiqueta e `window.print()`. |
| **Toolbar print** | Componente `apps/dealership-panel/src/components/inventory/qr-print-toolbar.tsx` com ações de imprimir e troca de formato. |

#### Passo D — QA executado do módulo QR (2026-05-06)

| Cenário | Resultado | Evidência |
| --- | --- | --- |
| Gating por módulo no tenant A | ✅ Aprovado | Usuário A (`qa-finance-a`) recebe `effective_modules = [finance_simulator]` (sem `qr_generator`). |
| Gating por módulo no tenant B | ✅ Aprovado | Usuário B (`qa-finance-b`) recebe `effective_modules = [finance_simulator, qr_generator]`. |
| Isolamento RLS de veículos | ✅ Aprovado | Em contexto autenticado: cada usuário lê `1` veículo do próprio tenant e `0` do outro tenant. |
| Resolução de URL canônica | ✅ Aprovado | Smoke test do helper shared cobrindo `custom_domain`, subdomínio da plataforma e fallback local. |
| Geração técnica do QR | ✅ Aprovado | `qrcode.toDataURL(...)` retorna payload PNG (`data:image/png;base64,...`) válido. |
| Impressão cross-browser e escaneamento físico | ⚠️ Pendente validação manual | Necessário validar com dispositivo real (Android/iOS) e impressão em Chrome/Edge no ambiente operacional; nesta rodada foi decidido encerrar com evidência técnica por ausência de sessão autenticada no browser automatizado. |

#### Passo D — checklist manual pendente (encerramento)

1. Abrir `/painel/estoque/[vehicleId]/qr` com usuário da loja B e imprimir em A4.
2. Escanear QR impresso com Android e iOS e confirmar abertura da URL do veículo correto.
3. Repetir em formato `etiqueta` e validar legibilidade/contraste.
4. Validar no browser Edge (além de Chrome) que o layout print não corta QR ou CTA.

---

### Simulador de financiamento — arquitetura alvo (após PRD de 2026-05-06)

| Campo | Valor |
| --- | --- |
| **Módulo** | `finance_simulator` |
| **Status técnico** | Refinamento concluído para execução (backend + frontend + QA) |
| **Superfícies** | `customer-site`, `admin-master`, `packages/shared`, Supabase (`public.leads`) |

#### Decisão API-first

1. **Função matemática compartilhada:** centralizar em `packages/shared/src/lib/finance/` (ex.: `calculate-price-installment.ts`) para evitar divergência entre apps.
2. **Contrato de entrada do cálculo:** `vehiclePrice`, `downPayment`, `monthlyInterestRate`, `termMonths`.
3. **Contrato de saída do cálculo:** `financedAmount`, `installmentAmount`, `totalPayable`, `totalInterest`, `monthlyInterestRate`, `termMonths`.
4. **Persistência de lead:** criar endpoint/action server-side para receber payload tipado da simulação e salvar em `public.leads` com snapshot.
5. **Taxa global:** ler de configuração de plataforma no `admin-master` (com fallback controlado), mantendo interface preparada para futura taxa por concessionária.

#### Contrato técnico sugerido para salvar lead

- **Command:** `createQualifiedFinanceLead(input)`
- **Input mínimo:**
  - `dealershipId`
  - `vehicleId`
  - `customerName`
  - `customerWhatsapp`
  - `vehiclePrice`
  - `downPayment`
  - `termMonths` (24 | 36 | 48 | 60)
  - `monthlyInterestRate`
  - `installmentAmount`
- **Regras técnicas:**
  - Validar `dealershipId` e `vehicleId` antes do insert.
  - Bloquear `downPayment >= vehiclePrice`.
  - Persistir snapshot numérico usado no cálculo (auditoria funcional).
  - Retornar erro estruturado para UI em português.

#### UX refinado (componente whitelabel no `customer-site`)

1. Card no contexto do veículo com título “Simule seu financiamento”.
2. Campo monetário para entrada + seletor de parcelas (24/36/48/60).
3. CTA “Calcular parcela”.
4. Bloco de resultado com parcela estimada, taxa usada e disclaimer legal.
5. Formulário pós-cálculo (nome + WhatsApp) com CTA “Enviar simulação”.
6. Estados obrigatórios: inicial, calculado, enviando, sucesso, erro.

#### Prompts técnicos detalhados (B/C)

1. **Shared (cálculo + tipos):**
   - Mover/centralizar fórmula Price para `packages/shared/src/lib/finance`.
   - Exportar interfaces em `packages/shared/src/types` para input/output da simulação.
2. **Admin (taxa global):**
   - Criar tela/setting de taxa mensal global no `admin-master`.
   - Expor action segura para leitura dessa taxa no fluxo público que calcula.
3. **Customer-site (UI + fluxo):**
   - Integrar componente whitelabel no detalhe/listagem de veículo.
   - Consumir utilitário compartilhado de cálculo.
   - Mostrar disclaimer e formulário de captura após cálculo válido.
4. **Supabase (lead):**
   - Confirmar que `public.leads` comporta snapshot da simulação; se faltar coluna, abrir migração incremental.
   - Inserir lead com `dealership_id` + `vehicle_id` + dados de contato + snapshot financeiro.
5. **Segurança/RLS:**
   - Revisar políticas para garantir isolamento por `dealership_id`.
   - Validar leitura/escrita por perfis corretos (anon cria lead público conforme regra vigente; operadores leem apenas sua loja quando aplicável).

#### QA — cenários obrigatórios

1. **Cálculo nominal:** veículo 100.000, entrada 20.000, taxa 1,99% a.m., 48x => parcela consistente entre frontend e utilitário shared.
2. **Borda entrada zero:** cálculo válido para 24/60 sem NaN/Infinity.
3. **Borda entrada inválida:** entrada >= valor veículo bloqueia envio e orienta usuário.
4. **Borda taxa zero (fallback):** sistema não quebra; aplica regra definida no contrato técnico.
5. **Persistência:** lead salvo contém snapshot completo e vínculos corretos (`dealership_id`, `vehicle_id`).
6. **RLS isolamento:** lead criado na loja A não aparece em consultas da loja B (UI e consultas diretas autenticadas por perfis distintos).
7. **Gating do módulo:** quando `finance_simulator` desabilitado, simulador não é renderizado.

#### Passo C — implementação deste módulo (2026-05-06)

| Item | Entrega |
| --- | --- |
| **Migração** | `supabase/migrations/20260506173000_platform_finance_settings.sql` com tabela singleton `public.platform_finance_settings` e taxa mensal global. |
| **Shared** | Novo utilitário `packages/shared/src/lib/finance/calculate-price-installment.ts` e tipo `FinanceSimulationSnapshot` em `packages/shared/src/types/finance-simulation.ts`. |
| **Admin** | Nova configuração global em `/painel/financeiro` com `PlatformFinanceSettingsForm` + action `updatePlatformFinanceSettingsAction`. |
| **Customer-site** | Simulador atualizado para taxa global (somente leitura), prazos 24/36/48/60 e cálculo sob ação explícita. |
| **Lead qualificado** | `submitPublicLeadAction` valida snapshot de simulação antes de salvar lead `type = 'simulation'`. |

#### Passo D — QA executado (2026-05-06)

| Cenário | Resultado | Evidência |
| --- | --- | --- |
| Migração de configuração global | ✅ Aprovado | `supabase db push --include-all` aplicado; tabela `public.platform_finance_settings` criada com linha `id = 1` e taxa `1.9900`. |
| Cálculo nominal e bordas | ✅ Aprovado | Smoke test executado via `tsx` no utilitário shared (`nominal_48x`, `entrada_zero_24x`, `entrada_zero_60x`, `taxa_zero_36x`, `principal_zero`) sem NaN/Infinity. |
| Políticas RLS da configuração global | ✅ Aprovado | `pg_policies` mostra `platform_finance_settings_select_public` e `platform_finance_settings_update_super_admin`. |
| Políticas RLS de leads por tenant | ✅ Aprovado (nível schema) | `pg_policies` de `public.leads` confirma regras `same_tenant` para `select/update/delete` e `insert` com vínculo de veículo/dealership. |
| Isolamento loja A x loja B em dados reais | ⚠️ Pendente massa de dados | Ambiente consultado sem registros em `dealerships/profiles/leads`; executar teste com duas lojas e dois usuários autenticados distintos. |

#### Passo D — teste manual pendente para encerramento

1. Criar (ou usar) duas concessionárias ativas com hosts distintos (A e B).
2. Gerar lead de simulação na loja A com veículo A.
3. Autenticar como usuário da loja B e confirmar ausência desse lead na listagem/consultas autorizadas.
4. Repetir invertendo origem (B -> A) para garantir simetria de isolamento.

#### Provisionamento QA executado (2026-05-06)

- Concessionárias de teste criadas/atualizadas:
  - `qa-finance-a` -> plano `starter`
  - `qa-finance-b` -> plano `business`
- Unidades (`dealership_units`) criadas para ambas (`Matriz`) e 1 veículo disponível por loja:
  - `qa-finance-a-nivus`
  - `qa-finance-b-corolla`
- Verificação de planos x módulos:
  - `starter` => `finance_simulator`
  - `business` => `finance_simulator`, `qr_generator`
- Hotfix aplicado no remoto para RPC de módulos efetivos:
  - migração `20260506174200_fix_effective_feature_keys_rpc.sql`
  - motivo: função antiga referenciava `dealerships.enabled_features` (coluna inexistente no schema atual)
  - pós-fix: `effective_feature_keys_for_active_dealership` retornando módulos corretos para as lojas QA.

#### QA A/B concluído (2026-05-06)

- Usuários de teste provisionados:
  - `11111111-1111-4111-8111-111111111111` -> perfil `seller` na `qa-finance-a`
  - `22222222-2222-4222-8222-222222222222` -> perfil `seller` na `qa-finance-b`
- Leads de simulação inseridos com contexto `anon` (1 por loja) após ajuste de RLS.
- Prova de isolamento validada:
  - contexto autenticado do usuário A enxerga apenas lead da `qa-finance-a`
  - contexto autenticado do usuário B enxerga apenas lead da `qa-finance-b`
- Verificação de módulos efetivos por usuário:
  - usuário A retorna apenas `finance_simulator` para sua loja.

#### Hotfixes de banco aplicados durante QA

1. `20260506174200_fix_effective_feature_keys_rpc.sql`
   - remove referência quebrada a `dealerships.enabled_features` no RPC de módulos efetivos.
2. `20260506174800_fix_anon_lead_insert_policy.sql`
   - ajuste intermediário da policy `leads_insert_anon_for_available_vehicle`.
3. `20260506175200_fix_anon_lead_insert_policy_with_public_vehicle_rpc.sql`
   - versão final da policy anon usando `get_public_vehicle_by_id(...)` (security definer).
4. `20260506175500_grant_get_public_vehicle_by_id_to_anon.sql`
   - restaura `grant execute` para `anon, authenticated` na função pública usada pela policy.
5. `20260506180000_fix_profiles_rls_recursion.sql`
   - corrige recursão infinita em RLS de `profiles` com funções helper (`current_profile_dealership_id`, `current_profile_role`).

---

### Simulador de financiamento — estado de baseline no código (antes da execução vertical)

_Registro histórico do que já existia antes da execução guiada pelo PRD aprovado em 2026-05-06._

| Superfície | Comportamento hoje | Referências |
| --- | --- | --- |
| **customer-site** | Página `/simular-financiamento`; **gate** por chave efetiva `finance_simulator` (`SimularFinanciamentoGate` + merge de chaves do RPC); componentes `FinanceSimulator`, `StandaloneFinanceClient`, snapshot para leads; cálculo de parcela em `lib/finance/calculate-finance-installment.ts`. | `src/app/(storefront)/simular-financiamento/`, `src/components/storefront/finance-simulator.tsx`, `vehicle-engagement-section.tsx`, `storefront-shell.tsx` |
| **dealership-panel** | Simulador na vitrine pública do painel (`FinanceSimulator`, `VehicleEngagementSection`, `LeadCaptureForm` com snapshot). | `src/components/public/FinanceSimulator.tsx`, `VehicleEngagementSection.tsx` |
| **Gating** | No `customer-site`, `getDealershipPublicRecord` preenche `enabled_features` com o resultado de `effective_feature_keys_for_active_dealership` quando o RPC não falha; caso contrário usa legado em `dealerships.enabled_features`. A página do simulador usa `isDealershipFeatureEnabled(..., 'finance_simulator')`. | `apps/customer-site/src/lib/tenant/get-dealership-public-record.ts`, RPC na migração `20260506103000_saas_modules_pricing_plans.sql` |
| **Admin** | CRUD de planos e módulos; chave `finance_simulator` já existe no seed. | `apps/admin-master` — actions `pricing-plans`, `saas-modules` |

**Follow-up técnico pós-PRD (exemplos):** persistência de simulações, integração com tabela financeira, taxas por loja, limites legais/disclaimer, métricas — **só após** BZ/aceite no PRD.

---

## Histórico vivo — decisões técnicas

- **2026-05-08 — Resolução de host e UX de erro:** registadas rotas `/erro/concessionaria` (`dealership-panel`, `customer-site`); migração `20260508240000_resolve_dealership_host_slug_ci.sql` (slug CI); regras **BZ-TERR-*** em `regras-de-negocio.md`; secção «Resolução de host» atualizada acima; doc partilhado `packages/shared/docs/TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md` §2.2.1.

- **Branch / PR:** _pendente_
- **Passo A:** PRD em `apps/admin-master/content/internal-docs/regras-de-negocio.md`.
- **Passo B:** refinamento UX + arquitetura + prompts (secções abaixo neste arquivo).
- **Passo C:** **implementado no repositório** — ver secção seguinte.
- **Passo D (QA):** executar checklist após aplicar a migração no ambiente Supabase.

### Passo C — Implementação (entregue no repo)

| Item | Detalhe |
| --- | --- |
| **Migração** | `supabase/migrations/20260504203000_dealerships_layout_id.sql` — coluna `public.dealerships.layout_id` (`smallint`, default `1`, `CHECK (1–3)`). |
| **Pré-requisito** | Sem esta migração aplicada no projeto remoto, inserts/updates com `layout_id` podem falhar; na leitura, `parseStorefrontLayoutId` mantém **1** como fallback se o campo vier ausente. |
| **Admin-master** | `dealership-dialog.tsx` («Aparência do site»), `actions/dealerships.ts`, `types/dealership-admin.ts`, `lib/data/dealerships.ts`. |
| **packages/shared** | `types/dealership-storefront.ts`, `types/dealership-config.ts` (`font_pair_id` opcional em JSON), `lib/theme/branding.ts` (`resolveDealershipFontStacks`), `docs/SUPABASE_TYPES.md`. |
| **customer-site** | `lib/tenant/get-dealership-public-record.ts`, `app/(storefront)/layout.tsx`, `components/storefront/storefront-shell.tsx`, `home-hero.tsx`, `home-featured-bento.tsx`, `vehicle-listing-grid.tsx`, `app/(storefront)/page.tsx`. |
| **dealership-panel** | `PublicSiteShell.tsx` + `app/(public)/layout.tsx` — incluem `layout_id` no record por compatibilidade de tipo com o RPC (sem shells alternativos no MVP). |

- **Identidade visual — logo cabeçalho/rodapé + Google Fonts:** `theme_config.header_logo_url`, `theme_config.footer_logo_url`, `theme_config.google_font_heading`, `theme_config.google_font_body` (com espelho legado `logo_url` no header); catálogo de famílias em `packages/shared/data/google-fonts-families.json`; `lib/theme/branding.ts` (`resolveDealershipHeaderLogoUrl`, `resolveDealershipFooterLogoUrl`, `resolveGoogleFontsHrefFromTheme`); vitrine: `storefront-shell.tsx`, `dealership-fonts-link.tsx`; admin: `dealership-form.tsx`, `google-font-family-combobox.tsx`, `actions/dealerships.ts`. **Admin shell:** barra lateral `fixed` em `admin-shell.tsx` (conteúdo principal faz scroll).

#### QA manual sugerido (após `db push` / SQL no Dashboard)

1. Duas lojas ativas com hosts distintos: alterar só `layout_id` e conferir hero + colunas da grade na home (`/#estoque`).
2. Alterar apenas cores em `theme_config` na loja A e confirmar que B não muda.
3. Confirmar que visitante público não altera `dealerships` via APIs expostas (RLS / ausência de mutação anônima).

#### Follow-ups opcionais (não bloqueantes)

- UI no admin para **`theme_config.font_pair_id`** (lista fechada já tipada em shared).
- Aplicar variantes de layout ao fluxo público do **dealership-panel**, se produto pedir paridade com a vitrine.

---

## Passo B completo — UX/UI

### Personas

| Persona | Objetivo |
| --- | --- |
| **Super Admin** | Cadastrar/editar concessionária e escolher **template do site** (1–3) sem depender de desenvolvedor. |
| **Visitante da vitrine** | Navegar loja com **estrutura** coerente com o template escolhido e **cores/logo/fontes** daquela loja. |

### Jornada — Super Admin (admin-master)

1. Acessa **Concessionárias** → «Nova concessionária» ou «Editar».
2. Preenche dados existentes (nome, slug, domínio, cores, logos, WhatsApp, etc.).
3. Na secção **«Aparência do site»** (nome sugerido), escolhe **Template**: opções claras «Template 1», «Template 2», «Template 3» com **descrição curta em português** da estrutura (hero à esquerda / hero central + grade 2 colunas / hero central + grade 4 colunas + bloco destaque).
4. (Opcional MVP+) Pré-visualização estática ou thumbnails geridos pela equipe — **fora do MVP** se não houver tempo.
5. Submete formulário → toast ou mensagem «Concessionária salva» (padrão atual do dialog).
6. Reabre edição → **mesmo template** pré-selecionado.

### Estados da UI (admin)

| Estado | Comportamento |
| --- | --- |
| **Inicial (criar)** | Template default **1** selecionado (radio ou select). |
| **Editar** | Template reflete `layout_id` gravado. |
| **Erro de rede / Supabase** | Mensagem em português; valor do formulário **não** é perdido (controlled/default estável). |
| **Validação** | Impossível enviar valor fora de 1–3 (tipo restrito no formulário). |

### Wireframes textuais — modal «Nova / Editar concessionária»

_Ordenação sugerida dentro do dialog existente (`dealership-dialog.tsx`):_

```
[ Campos já existentes: nome, slug, CNPJ, domínio, e-mail, WhatsApp, status, plano… ]

─── Aparência do site ───────────────────────────────
  Template do vitrine *
  ( ) Template 1 — Hero em banner com destaque à esquerda
  ( ) Template 2 — Hero central em tela cheia; vitrine em duas colunas
  ( ) Template 3 — Hero central; vitrine em até quatro colunas + área de destaques

  [ cores primária/secundária, logo, favicon — já existentes ]

─── Conteúdo institucional ──────────────────────────
  [ about, endereço, redes — já existentes ]
```

Microcopy PT sugerido nos rótulos dos três templates deve espelhar **estrutura**, não marca Guiotti dos HTMLs de referência.

### Responsividade e whitelabel

- Os três templates devem ter **mobile-first**: navegação colapsável ou scroll horizontal já usada no projeto; grids dos layouts recuam para 1 coluna em `sm`.
- **Nenhuma** cor hexadecimal dos mocks deve ficar hardcoded nos componentes React — apenas **`theme_config`** → já existe pipeline parcial via `resolveDealershipBranding` + CSS vars em `StorefrontShell`; estender vars para gradientes/bordas quando necessário.
- Tipografia: lista **fechada** de pares (ex.: «Padrão», «Serif editorial», «Sans geométrica») mapeada internamente para `next/font` — não aceitar fontes livres digitadas no MVP.

### Divergência produto × HTML de referência

- HTML **layout 2** não contém «busca lateral». Se produto exigir filtros laterais no template 2, tratar como **incremento futuro** (novo slot lateral), não como cópia literal do HTML atual.

---

## Passo B — Arquitetura refinada (API-first)

### Descoberta no código atual (pós-implementação)

- **`get_dealership_public_by_id`** retorna `setof public.dealerships`; com a migração aplicada, **`layout_id`** passa na linha sem mudança de assinatura da função.
- **`customer-site`** centraliza o mapa RPC → modelo em **`getDealershipPublicRecord()`** (React `cache`), usado pelo layout da vitrine e pela home.
- **`StorefrontShell`** aplica **`resolveDealershipBranding`**, **`resolveDealershipFontStacks`** (`--dealer-font-heading` / `--dealer-font-body`) e **`data-storefront-layout`** para observabilidade.

### Contratos TypeScript (`packages/shared`) — estado atual

Implementados em **`packages/shared/src/types/dealership-storefront.ts`** (`StorefrontLayoutTemplateId`, `parseStorefrontLayoutId`) e **`dealership-config.ts`** (`DealershipFontPairId`, `font_pair_id?` em `DealershipThemeConfig`).

---

## Passo B — Viabilidade (debate do time)

| Área | Veredito | Notas |
| --- | --- | --- |
| **Backend** | **Viável** | Uma coluna + constraint; RPC público legado absorve coluna. Opcional: estender `theme_config` com `font_pair_id` na mesma sprint ou sprint seguinte. |
| **Admin UI** | **Viável** | `DealershipDialog` já centraliza create/update; radio group + campo em `FormDefaults` / actions. |
| **Customer-site** | **Viável com esforço médio** | Refatorar `StorefrontShell` em **facade** que delega para `StorefrontTemplateLayout` por `layout_id`; extrair nav/footer comuns ou duplicar controladamente conforme HTML de referência. |
| **Performance** | **Atenção** | Três bundles de layout podem aumentar JS — preferir componentes server + CSS compartilhado; lazy não obrigatório no MVP. |
| **QA** | **Viável** | Dois hosts locais ou `/etc/hosts` + dois slugs para CA-001. |

---

## Passo B — Prompts de execução detalhados (Cursor)

_Histórico — executados em **2026-05-04**. A implementação seguiu a ordem; **Prompt 7** não criou `storefront-layout-registry.tsx` nem três shells em arquivos separados — as variantes ficaram em **`HomeHero`**, **`VehicleListingGrid`**, **`HomeFeaturedBento`** e ajustes em **`StorefrontShell`**._

Executar **nesta ordem**. Código em inglês; UI e rotas em português (`rules/naming-and-language.mdc`).

---

### Prompt 1 — Migração `layout_id`

```
No monorepo AutoPainel, add a new SQL migration under supabase/migrations/
(timestamptz prefix, lowercase SQL) that:
- Adds public.dealerships.layout_id smallint NOT NULL DEFAULT 1 with CHECK (layout_id IN (1,2,3))
- Adds comment on column explaining storefront template variant
Do not run supabase db push; only commit the migration file per rules/supabase-workflow.mdc.
```

---

### Prompt 2 — Tipos shared + tema opcional

```
In packages/shared:
- Create dealership-storefront.ts (or extend existing types) exporting StorefrontLayoutTemplateId (= 1|2|3) and optional DealershipFontPairId + DealershipThemeConfigV1 shape.
- Export from packages/shared/src/types/index.ts.
- Extend DealershipThemeConfig usage docs in packages/shared/docs/SUPABASE_TYPES.md with layout_id + optional font_pair_id.
- Update packages/shared/src/lib/theme/branding.ts only if needed to read font_pair_id later (can stub no-op mapping to CSS vars in a follow-up prompt).
```

---

### Prompt 3 — Admin types + fetch normalização

```
In apps/admin-master:
- Add layout_id to DealershipAdminRow (type StorefrontLayoutTemplateId from shared).
- Ensure apps/admin-master/src/lib/data/dealerships.ts normalizeRow passes layout_id from DB (number → coerce to 1|2|3).
```

---

### Prompt 4 — Actions create/update

```
In apps/admin-master/src/actions/dealerships.ts:
- Parse layout_id from FormData (radio name e.g. layout_id), validate ∈ {1,2,3}, default 1 on create.
- Include layout_id in insert/update payloads to Supabase dealerships table.
```

---

### Prompt 5 — DealershipDialog UI

```
In apps/admin-master/src/components/dealership-dialog.tsx:
- Add Portuguese section «Aparência do site» with RadioGroup or three radios for layout_id 1–3 with short Portuguese descriptions matching PRD structure (not mock brand names).
- Wire getDefaults / submit hidden fields for edit mode.
- Keep existing formatting/import style per user rules.
```

---

### Prompt 6 — Customer-site tipo + layout loader

```
In apps/customer-site:
- Extend DealershipPublicRecord with layout_id: StorefrontLayoutTemplateId.
- In src/app/(storefront)/layout.tsx, map row.layout_id from get_dealership_public_by_id RPC with fallback 1 if null/invalid.
```

---

### Prompt 7 — Registry de templates

```
In apps/customer-site/src/components/storefront/ (English filenames):
- Create storefront-layout-registry.tsx exporting function resolveStorefrontLayout(layoutId): component type or switch.
- Create three layout shell components StorefrontLayoutOne.tsx, StorefrontLayoutTwo.tsx, StorefrontLayoutThree.tsx that receive props: dealership (DealershipPublicRecord), children, theme/branding helpers — replicate REGION STRUCTURE from Desktop reference HTMLs but replace hardcoded colors with var(--dealer-*) and Tailwind arbitrary values referencing CSS variables where needed.
- Share header/footer fragments in storefront-shell-shared.tsx if DRY makes sense without over-abstracting.
```

---

### Prompt 8 — Integrar facade no shell atual

```
Refactor apps/customer-site/src/components/storefront/storefront-shell.tsx:
- Keep CSS variable injection based on resolveDealershipBranding.
- Delegate inner layout structure to the resolved template component from Prompt 7.
- Preserve PublicDealershipProvider, WhatsApp link, finance simulator flag, Portuguese nav labels.
```

---

### Prompt 9 — Página inicial por template

```
Ensure apps/customer-site/src/app/(storefront)/page.tsx (or equivalent home) renders hero/grid regions appropriate inside each template shell OR passes slots — templates should define where `{children}` and homepage hero/list sections sit consistently without breaking existing anchors like #estoque.
```

---

### Prompt 10 — QA checklist automatizável / manual

```
Document manual QA: two dealerships different slug + hosts, different layout_id + theme_config — verify CA-001–CA-006 from PRD. Verify anon cannot PATCH dealerships via REST if exposed.
```

---

## Histórico vivo — 2026-05-14 — `super_admin` no `dealership-panel`

- Atualizado `apps/dealership-panel/src/lib/dashboard/require-dashboard-session.ts` para aceitar `role = super_admin` em qualquer host de concessionária resolvido por cookie (`ap-dealership-id`), mantendo bloqueio para perfis sem vínculo/sem permissão.
- Endurecido escopo tenant no app com filtros explícitos por `dealership_id` em consultas de painel (`/painel`, `/painel/estoque`, `/painel/contatos`, `/painel/integracoes` e ações de estoque), evitando dependência exclusiva de RLS para escopo visual.
- APIs de início OAuth (`/api/painel/integracoes/*/oauth/start`) passam a autorizar `super_admin` além do perfil vinculado à loja.
- Nova migração `supabase/migrations/20260514013000_super_admin_max_access_dealership_panel.sql` cria políticas RLS permissivas de `super_admin` para superfícies operacionais do painel (vehicles, leads, profiles, dealerships, units e conexões/sessões OAuth), garantindo acesso máximo sem quebrar o fluxo multi-tenant por host.
- Correção pós-migração: `supabase/migrations/20260514014000_fix_profiles_super_admin_rls_recursion.sql` remove recursão potencial na policy de `public.profiles` (`profiles_select_super_admin`). A policy anterior referenciava `public.is_platform_super_admin()`, que consulta `public.profiles`; a versão corrigida usa `private.current_profile_role()` para validar `super_admin` sem auto-referência de RLS.

## Histórico vivo — 2026-05-14 — padronização visual Admin + Painel da loja

- Novo componente compartilhado `packages/shared/src/ui/page-container.tsx` (exportado em `packages/shared/src/ui/index.ts`) para unificar largura/margens horizontais entre `admin-master` e `dealership-panel`.
- `apps/admin-master/src/components/admin-shell.tsx` passou a usar `PageContainer` no cabeçalho contextual e no conteúdo principal, reduzindo divergência de spacing entre páginas.
- `apps/admin-master/src/components/dealerships-table.tsx` substituiu selects nativos por componentes `Select` do shared shadcn e consolidou bloco de filtros em `Card`/`CardContent`.
- `apps/dealership-panel/src/components/dashboard/DashboardShell.tsx` foi normalizado para fundo claro e navegação com `Button` do shared shadcn; header agora exibe `logo` da loja quando disponível.
- `apps/dealership-panel/src/app/painel/layout.tsx` passou a resolver `logo` e `favicon` da concessionária e aplicar `generateMetadata()` com ícone por tenant no painel.
- `apps/customer-site/src/app/(storefront)/layout.tsx` passou a publicar favicon por loja em `generateMetadata()` via `resolveDealershipFaviconUrl`.
- `apps/dealership-panel/src/app/globals.css` removeu override `prefers-color-scheme: dark` para manter o painel da loja sempre em fundo claro (tema da vitrine segue independente).

## Histórico vivo — 2026-05-14 — skeleton global + evolução de formulário de veículos

- Adicionado componente shadcn `Skeleton` em `packages/shared/src/ui/skeleton.tsx` (via CLI) e export em `packages/shared/src/ui/index.ts`.
- Novos `loading.tsx` para cobertura de carregamento em múltiplas superfícies:
  - `apps/admin-master/src/app/loading.tsx`
  - `apps/admin-master/src/app/(platform)/painel/loading.tsx`
  - `apps/dealership-panel/src/app/loading.tsx`
  - `apps/dealership-panel/src/app/painel/loading.tsx`
  - `apps/dealership-panel/src/app/(public)/loading.tsx`
  - `apps/customer-site/src/app/loading.tsx`
  - `apps/customer-site/src/app/(storefront)/loading.tsx`
  - `apps/marketing-site/src/app/loading.tsx`
- Formulário de veículos (`apps/dealership-panel/src/components/inventory/VehicleForm.tsx`) incrementado com:
  - tipo de veículo (lista + `outro` com texto customizado),
  - valor FIPE,
  - valor de venda,
  - flag `destaque`,
  - seletor de ativação/inativação do anúncio.
- Ações de create/update (`apps/dealership-panel/src/app/painel/estoque/actions.ts`) atualizadas para persistir os novos campos e manter compatibilidade com `price` legado via espelho para `sale_price`.
- Inventário e edição de veículo ajustados para leitura/exibição dos campos novos:
  - `apps/dealership-panel/src/app/painel/estoque/page.tsx`
  - `apps/dealership-panel/src/components/inventory/VehicleInventoryTable.tsx`
  - `apps/dealership-panel/src/app/painel/estoque/[vehicleId]/editar/page.tsx`
- Nova migração de dados/contratos públicos:
  - `supabase/migrations/20260514030000_vehicle_catalog_fields_and_active_visibility.sql`
  - adiciona colunas `vehicle_type`, `vehicle_type_custom`, `fipe_price`, `sale_price`, `is_featured`, `is_active`,
  - aplica checks e índices,
  - força RPCs públicas (`list_public_vehicles_filtered`, `get_public_vehicle_by_slug`, `private.get_public_vehicle_by_id_impl`) a retornarem apenas veículos `status='available'` e `is_active=true`.
- Novo smoke visual automatizado: `e2e/specs/visual-layout-smoke.spec.ts` valida ausência de overflow horizontal em superfícies públicas e páginas de autenticação (rotas dependentes de app não iniciado ficam em `skip` controlado).
- Refino visual premium (frontend): `apps/admin-master/src/components/admin-shell.tsx` ganhou header operacional com `CommandDialog` (busca global), dropdown de utilizador e notificações; `apps/customer-site/src/components/storefront/storefront-shell.tsx` adotou `NavigationMenu` para navegação horizontal limpa; `apps/customer-site/src/components/storefront/home-hero.tsx` ganhou quick-search integrada ao hero.

#### Fase 5 — QA (`ui_standardization_admin_and_dealership_panel`)

**E2E (automatizado)**

- Execução: `E2E_DEALERSHIP_SLUG=guiotti npm run test:e2e`
- Resultado: **13 passed**
- Novo cenário automatizado: `dealership-panel keeps light background on auth boundary` (`e2e/specs/dealership-panel-tenant.spec.ts`) garantindo que o painel da loja permaneça claro mesmo no boundary de autenticação.

**Cenários QA (Given / When / Then)**

Test: painel da loja mantém fundo claro  
Given: concessionária válida em host `slug.localhost:3002`  
When: utilizador navega para `/painel` sem sessão e cai no login  
Then: `body` mantém `rgb(255, 255, 255)` (fundo claro)  
Status: [x] passed

Test: tenant routing não regressiona após refresh visual  
Given: slug válido e inválido no ambiente local  
When: abrir raiz e `/painel` em `dealership-panel` e `customer-site`  
Then: slug válido resolve tenant; inválido redireciona para `/erro/concessionaria`  
Status: [x] passed

Test: favicon por loja na vitrine  
Given: concessionária com `theme_config.favicon_url` preenchido  
When: acessar `customer-site` da loja  
Then: metadata publica `icons.icon` e `icons.shortcut` com o favicon configurado  
Status: [ ] manual pendente

**Matriz de permissões / RLS (feature atual)**

| Role | Action | Expected Result |
| --- | --- | --- |
| `super_admin` | acessar `admin-master` e padronização visual | ✅ permitido |
| `super_admin` | acessar `dealership-panel` por host de qualquer loja | ✅ permitido (tenant por host/cookie) |
| `owner` / `manager` | acessar `dealership-panel` da própria loja | ✅ permitido |
| `seller` | acessar áreas permitidas no `dealership-panel` | ✅ permitido (restrições de ação mantidas) |
| `owner` / `manager` / `seller` | acessar `admin-master` | ❌ bloqueado |
| `anon` | acessar `/painel` no `dealership-panel` | ❌ redirecionado para `/login` |
| `anon` | host inválido (`dealership-panel` / `customer-site`) | ❌ `/erro/concessionaria` |

**Checklist de segurança (Supabase-focused)**

- [x] RLS continua habilitado nas tabelas tocadas (sem desativação nesta fase).
- [x] Isolamento por tenant mantém-se no fluxo por host/cookie e filtros explícitos.
- [x] Requisições não autenticadas no painel são bloqueadas/redirecionadas antes de mutações.
- [x] Sem exposição de tokens/segredos em mensagens desta fase.
- [x] Sem novas Edge Functions nesta entrega.

**Riscos de regressão**

- Inconsistência residual em páginas que ainda não migraram completamente para primitives shared.
- Dependência de assets externos (logo/favicon) pode gerar fallback visual em ambientes com links expirados.
- Diferenças de contraste podem aparecer em branding extremo (cores muito próximas ao fundo).

**Findings & Follow-ups**

| # | Severity | Description | Owner | Status |
|---|----------|-------------|-------|--------|
| 1 | 🟡 minor | Favicon por loja validado por contrato/metadata; falta smoke visual automatizado assertivo em navegador para casos com e sem favicon | Frontend + QA | open |
| 2 | 🟡 minor | Ainda há espaço para ampliar cobertura E2E de consistência visual em páginas de CRUD do `admin-master` | QA | deferred |

---

## Iniciativa — Ambiente demo E2E (3 concessionárias) — 2026-05-26

| Campo | Valor |
| --- | --- |
| **Objetivo** | Seed idempotente + templates vitrine 1/2/3 + gestores demo para validação ponta a ponta |
| **Migração** | `supabase/migrations/20260514120000_seed_demo_dealerships_e2e.sql` |
| **Script usuários** | `scripts/seed-demo-dealership-users.mjs` (`npm run seed:demo-users`) |
| **Apps** | `customer-site` (layouts), `dealership-panel` (RLS estoque), `admin-master` (já edita `layout_id`) |

### Seed (Postgres)

- Upsert por `dealerships.slug`: `guiotti`, `autoprime`, `ecodrive`
- `layout_id`: 1 / 2 / 3 respectivamente
- `theme_config`: cores primária/secundária, `storefront_theme_mode: dark`, fontes Google
- `content_config.about_text` + `hq_address`
- Unidade `Matriz` em `dealership_units` (obrigatória para `vehicles.dealership_unit_id`)
- 6 veículos demo por loja (`public_slug` prefixo `demo-`, `is_featured` nos primeiros de cada loja)
- **Nota:** update em conflito de slug **não** altera `pricing_plan_id` (trigger de plano só operador)

### Frontend (`customer-site`)

| Arquivo | Papel |
| --- | --- |
| `src/components/storefront/storefront-home-layout.tsx` | Orquestra home por `layout_id` |
| `src/components/storefront/home-hero.tsx` | Hero premium por template (ref. layout1/2/3 HTML) |
| `src/components/storefront/home-heritage-section.tsx` | Secção herança (layouts 1 e 2) |
| `src/components/storefront/home-featured-bento.tsx` | Destaques dinâmicos (`is_featured`) — layout 3 |
| `src/components/storefront/vehicle-listing-grid.tsx` | Cards por template (2 cols layout 1/2, 4 cols layout 3) |
| `src/components/storefront/storefront-shell.tsx` | Header premium por template |
| `next.config.ts` | `images.remotePatterns` inclui `images.unsplash.com` |

### Credenciais demo (painel)

| E-mail | Loja | Senha |
| --- | --- | --- |
| `gestor.guiotti@autopainel.demo` | guiotti | `LojaDemo123!` |
| `gestor.autoprime@autopainel.demo` | autoprime | `LojaDemo123!` |
| `gestor.ecodrive@autopainel.demo` | ecodrive | `LojaDemo123!` |

### URLs locais

- Vitrine: `http://{slug}.localhost:3003`
- Painel: `http://{slug}.localhost:3002/login`

### QA checklist (manual)

- [ ] `guiotti.localhost:3003` — layout 1 dourado, sidebar filtros, 6 veículos
- [ ] `autoprime.localhost:3003` — layout 2 vermelho, hero central, herança, grid 2 colunas
- [ ] `ecodrive.localhost:3003` — layout 3 azul, bento destaques, grid 4 colunas
- [ ] Login gestor em cada painel — estoque isolado (RLS)
- [ ] Editar preço de um veículo demo — vitrine reflete após refresh
- [ ] Host inválido continua em `/erro/concessionaria`

### Hotfix QA (2026-05-26)

| Defeito | Causa | Correção |
| --- | --- | --- |
| Vitrine: `permission denied for function list_public_vehicles_filtered` | Migration `20260514030000` recriou RPCs sem `grant execute` para `anon` | `supabase/migrations/20260526120000_grant_public_vehicle_list_rpcs.sql` |
| Painel estoque: `images.unsplash.com` não configurado | Seed demo usa imagens Unsplash; só `customer-site` tinha `remotePatterns` | `apps/dealership-panel/next.config.ts` — hostname `images.unsplash.com` |

---

## Sprint lapidação UX/copy/whitelabel/financiamento — 2026-05-26

| Campo | Valor |
| --- | --- |
| **Objetivo** | Vitrine com copy de vendas; painel lojista legível; motor CSS unificado; simulador Price+IOF; planos demo distintos para gating |
| **Migração** | `supabase/migrations/20260526153000_demo_dealership_differentiated_plans.sql` (aplicada no remoto) |

### Shared

| Arquivo | Papel |
| --- | --- |
| `packages/shared/src/lib/finance/calculate-finance-simulation.ts` | Tabela Price + estimativa IOF (0,38% + 0,0082%/dia × prazo) |
| `packages/shared/src/lib/theme/storefront-css-vars.ts` | `buildStorefrontCssVariables` — aliases `--primary-color`, `--secondary-color`, `--storefront-*` |
| `packages/shared/src/types/finance-simulation.ts` | Snapshot com `estimatedIofAmount`, `principalWithIof`, prazos 12–60 |

### customer-site

- Copy hero/layout: linguagem de vendas («Encontre seu carro», «Agende um test drive»); removido jargão técnico.
- `finance-simulator.tsx`: prazos 12/24/36/48/60, select shadcn, slider entrada, disclaimer legal.
- `storefront-shell.tsx` + `globals.css`: consome motor CSS unificado.
- `public-lead.ts`: aceita `termMonths = 12`.

### dealership-panel

- `DashboardShell.tsx`: sidebar shadcn, agrupamentos Operação/Divulgação, link vitrine via `buildDealershipSubdomainSurfaceUrls`.
- `painel/layout.tsx`: RPC `effective_feature_keys_for_active_dealership` → gating menu Integrações.
- `painel/page.tsx`: copy amigável (sem RLS/cookie exposto ao lojista).
- `integracoes/page.tsx`: só renderiza secções habilitadas; redirect `/painel` se plano sem integrações.

### Planos demo (pós-migração)

| Slug | Plano | Chaves efetivas esperadas |
| --- | --- | --- |
| `guiotti` | enterprise | catálogo completo |
| `autoprime` | business | `finance_simulator`, `qr_generator` |
| `ecodrive` | starter | `finance_simulator` |

### QA manual (lapidação)

- [ ] Simular financiamento na vitrine → lead tipo `simulation` em `/painel/contatos`
- [ ] EcoDrive: sem menu Integrações; Guiotti: com Integrações
- [ ] AutoPrime: QR no estoque; EcoDrive: sem QR
- [ ] Alterar cor primária no admin/painel → vitrine reflete após refresh

### Hotfix UX/CRM/imagens (2026-05-27)

| Item | Detalhe |
| --- | --- |
| **Migração** | `20260527090000_leads_assigned_user_business_plan_demo_images.sql` — `leads.assigned_user_id`, plano `business` só finance+QR, URLs Unsplash demo |
| **Vitrine filtros** | `vehicle-filters-panel.tsx` — selects por marca/modelo/faixa/ano; layout unificado responsivo nos 3 templates |
| **Copy vitrine** | `lead-capture-form.tsx`, cards estoque, detalhe veículo — CTAs promocionais |
| **Painel** | Sidebar fixa, `DashboardNotificationCenter`, `LeadInbox` com busca/filtro |
| **QR print** | `@media print` oculta shell; folha A4/etiqueta limpa |

### Hotfix vitrine WhatsApp, filtros e integrações (2026-05-27)

| Item | Detalhe |
| --- | --- |
| **Migração** | `20260527120000_vehicle_type_filter_guiotti_motos.sql` — `p_vehicle_type` em `list_public_vehicles_filtered`, motos demo Guiotti, fix URLs Unsplash 404 |
| **WhatsApp UTM** | `build-storefront-whatsapp-url.ts` — `utm_source=vitrine`, `utm_medium=whatsapp`, `utm_campaign`, `utm_content={slug}`; hero sem `/contato` |
| **Filtro tipo** | `vehicle-filters-panel.tsx` + `build-vehicle-filter-options.ts` — select tipos cadastrados no estoque |
| **Header mobile** | `storefront-header-nav.tsx` — menu colapsável em `< md` |
| **OAuth demo** | `oauth/start` → HTTP 503 `oauth_not_configured` quando env OLX/WebMotors ausente |
| **E2E** | `e2e/specs/storefront-lapida-qa.spec.ts` |

### Notificações e layout painéis (2026-05-27)

| Item | Detalhe |
| --- | --- |
| **Shared UI** | `packages/shared/src/ui/sheet.tsx`, `scroll-area.tsx`, `components/notification-center.tsx` — sininho + badge vermelho + Sheet `100dvh` |
| **Painel lojista** | `DashboardNotificationCenter` refatorado; `DashboardMobileNav` (Sheet lateral); `dashboard-mobile-nav-mount.tsx` evita hydration mismatch; header harmonizado |
| **Admin master** | `AdminNotificationProvider` — subscription única + `AdminNotificationTrigger` no header mobile/desktop; corrige erro Realtime por canal duplicado |
| **E2E OAuth** | `e2e/helpers/dealership-panel-login.ts`, `e2e/specs/dealership-panel-integrations-oauth.spec.ts` |

### Vitrine — página `/estoque` e detalhe veículo (2026-05-27)

| Item | Detalhe |
| --- | --- |
| **Rota** | `apps/customer-site/src/app/(storefront)/estoque/page.tsx` — estoque completo com filtros avançados (marca, modelo, preço, ano, tipo, km, ordenação) |
| **Home** | `storefront-home-layout.tsx` + `home-inventory-teaser.tsx` — home dos 3 templates mantém hero; teaser de destaques com link “Ver estoque completo” |
| **Layout** | `storefront-page-container.tsx` (`max-w-7xl`), `storefront-inventory-page.tsx`, `vehicle-inventory-list.tsx` (cards horizontais estilo classificados) |
| **Detalhe** | `vehicle-detail-layout.tsx` — galeria, grid de specs, sidebar sticky, WhatsApp com UTM |
| **RPC** | `list_public_vehicles_filtered` — params `p_vehicle_type`, `p_min_mileage`, `p_max_mileage`; repair idempotente em `20260527140000_repair_list_public_vehicles_rpc.sql` |
| **Nav** | Links de estoque apontam para `/estoque` (não `/#estoque`); E2E filtro moto em `/estoque?vehicleType=motocicleta` |
| **Templates 1 e 2** | Alinhamento unificado via `StorefrontPageContainer` + header/footer `max-w-7xl`; layout 1 editorial; layout 2 performance com carrossel por setas (`home-inventory-carousel.tsx`) |
| **Notificações lidas** | `useNotificationReadState` + localStorage; marcar ao clicar ou “Marcar todas como lidas”; paridade admin/painel |
| **Estoque painel** | `/painel/estoque/[vehicleId]` visualização; ficha técnica WebMotors-like; share social via `social_publication_jobs` |
| **Lista estoque painel** | `VehicleInventoryTable.tsx` — ações só ícones (visualizar, editar, excluir); QR, vitrine e share social apenas em `/painel/estoque/[vehicleId]` |
| **Nav mobile painel** | `DashboardMobileNav.tsx` — `/painel` ativo só em pathname exato (corrige “Visão geral” sempre destacado) |
| **Migração catálogo** | `20260527160000_vehicle_detail_catalog_fields.sql` — version, fuel, transmission, color, body, condições, features[] |
| **Migração specs por tipo** | `20260527180000_vehicle_type_specs_and_storefront_filters.sql` — colunas técnicas (`gear_count`, `displacement_cc`, motor, freios, tração, eixos, lugares, etc.); tipo `onibus`; RPC `list_public_vehicles_filtered` com `p_fuel_type`, `p_transmission`, `p_color`, `p_min/max_displacement_cc`, `p_gear_count` |
| **Form painel** | `vehicle-type-spec-fields.tsx`, `parse-vehicle-type-spec-form.ts` — campos condicionais por `vehicle_type` (motos WebMotors-like; caminhões; vans/ônibus) |
| **Integrações classificados** | Popup OAuth OLX/WebMotors com diálogo de confirmação antes do login; mensagens amigáveis (`integration-user-messages.ts`); config plataforma em `platform_classifieds_oauth_providers`; RPC `disconnect_dealership_classifieds_connection`; migração `20260526190000_platform_classifieds_oauth_and_disconnect.sql` |
| **Shared** | `packages/shared/src/lib/vehicle/vehicle-type-spec-options.ts`, `vehicle-type-labels.ts` (`onibus`), `supabase-rpc.ts` |
| **Hydration** | `vehicle-filters-panel.tsx` usa `panelId` fixo na página de estoque; filtros duplicados removidos da home |

**Nota Supabase:** se `db push` falhou em `20260527120000` (revoke de overload inexistente), marcar repair conforme CLI e aplicar `20260527140000` no remoto.

---

## Diagrama de dependências (ref.)

```text
packages/shared (tipos + tema + layout_id)
       ↑                    ↑
admin-master              customer-site
       ↓                    ↓
   Supabase dealerships (layout_id + theme_config + slug/custom_domain)
```

---

## Template sugerido (novas funcionalidades)

### Funcionalidade

- **Nome:**
- **Branch / PR:**

### Superfícies e contratos

- **RPC / REST / Edge:** …
- **Tipos (`packages/shared`):** …

### Dados e segurança

- **Tabelas / migrações:** …
- **RLS (resumo):** …

### Referências

- …
