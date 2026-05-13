# Documentação técnica interna

Esta página é **somente para a equipe AutoPainel**. Use para registrar decisões de arquitetura, contratos de API, migrações relevantes e links para artefatos no repositório.

## Como manter atualizado

1. Após o refinamento (**Architect + Backend**), registre aqui os contratos principais (RPCs, tabelas novas, políticas RLS em alto nível, Edge Functions).
2. Referencie sempre os tipos compartilhados em `packages/shared` e documentação cross-cutting em `packages/shared/docs/` quando aplicável.
3. Prefira **salvar pelo painel Admin** (botão «Salvar alterações»).
4. Este arquivo é **fallback** quando a migração `platform_internal_documents` ainda não foi aplicada.

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

**PRD `tenant_operator_journey`:** rascunho **Em revisão** (BZ-TOJ-*, CA-TOJ-*) no mesmo ficheiro `regras-de-negocio.md`; o PM humano fecha **Aprovado** antes de levantar o bloqueio a UX; esta secção técnica permanece a referência de implementação (RPCs, rotas, env).

- **`resolve_dealership_id_by_host`**: continua a devolver apenas lojas **`status = 'active'`** (vitrine + cookie seguro para visitantes).
- **`resolve_dealership_id_by_host_for_dashboard`**: mesma lógica de host **sem** filtro de `status`; no **`dealership-panel`** o middleware usa **sempre** este modo para todas as rotas que exigem cookie de tenant (`/` incluído — antes só `/painel` e `/login` usavam dashboard e `/` caía na RPC «vitrine», gerando `/erro/concessionaria`). **`customer-site`** continua com `resolve_dealership_id_by_host` (só `active`).
- **`get_dealership_id_by_slug_for_dashboard`**: usada apenas por **`GET /painel/acesso/:slug`** quando **`NEXT_PUBLIC_ENABLE_DEALERSHIP_PANEL_SLUG_BOOTSTRAP=true`** (dev/opt-in; **desligado** por defeito — sem página pública de slug); resolve o `id` pelo slug **sem** exigir `active` (painel); produção permanece **`Host`**/`custom_domain` + URLs geradas no Admin («Acesso à loja»).
- **Multi-loja local com subdomínio** (`{slug}.localhost:PORT`): com `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=localhost`, o primeiro segmento do host mapeia `dealerships.slug`. **Painel em `localhost` nu:** usar botões do Admin ou subdomínio local; opcionalmente bootstrap por path só com flag acima; a vitrine pode ainda usar variáveis legadas `DEVELOPMENT_TENANT_*` em cenários pontuais (`readDevelopmentTenantSlugFromEnv`). Desenho OAuth por concessionária, migração Vercel e **revisão por função (PM/UX/Backend/Frontend/QA):** `packages/shared/docs/TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md` (§7). **Credenciais OAuth app por loja (classificados):** `supabase/migrations/20260508220000_dealership_classifieds_oauth_apps.sql` + tipos `classifieds-oauth-app.ts`.
- **Slug case-insensitive no resolver:** `supabase/migrations/20260508240000_resolve_dealership_host_slug_ci.sql` — comparação de `dealerships.slug` com o subdomínio via `lower(trim(...))` para evitar falhas quando o registo na BD difere em maiúsculas do host.
- **Rota `/erro/concessionaria` (painel + vitrine):** quando o middleware não resolve `dealership_id` a partir do host (RPC devolve `null`), redireciona-se para esta rota em **`dealership-panel`** e **`customer-site`**. **Não** confundir com o erro HTTP 404 do Next.js: a página comunica em PT que o tenant não foi resolvido; em `development` mostra checklist (`.env` com `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`, `npm run sync:env`, alinhamento slug ↔ host; na vitrine, nota sobre `status = active`). Implementação: `apps/dealership-panel/src/app/erro/concessionaria/page.tsx`, `apps/customer-site/src/app/erro/concessionaria/page.tsx`. Critérios de falha comuns: `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` vazio no Edge (mitigado para hosts `*.localhost` — ver abaixo); slug inexistente; vitrine com loja não `active`. Código: `resolveDealershipIdFromHost`, RPCs acima, `apps/*/src/lib/supabase/middleware.ts` (padrões por app). **Mitigação `*.localhost`:** `resolveEffectivePlatformRootDomain` (`packages/shared/src/lib/tenant/effective-platform-root-domain.ts`) — quando o `Host` (sem porta) é `{slug}.localhost`, a raiz passada às RPCs é **sempre** `localhost` **antes** de usar `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`, para evitar `null` em dev com env já apontado para produção (ex.: `autopainel.com.br` + host `guiotti.localhost`). Se a variável pública faltar no Edge e o host for `*.localhost`, o resultado continua `localhost`. Logging opcional `[tenant-host-resolve]` nos resolvers quando a RPC falha. **`localhost` nu:** usar `http://slug.localhost:PORT` ou `NEXT_PUBLIC_DEVELOPMENT_TENANT_SLUG` + redireccionamento (`buildBareLocalhostTenantRedirectUrl` em `development-tenant-slug-env.ts`) — o Edge pode omitir `DEVELOPMENT_TENANT_SLUG`. **RLS (correção 2026-05-08):** migração `supabase/migrations/20260508253000_resolve_dealership_id_by_host_private_impl.sql` — lógica em `private.resolve_dealership_id_by_host_impl`; `public.resolve_dealership_id_by_host` é delegate **SECURITY INVOKER** (alinhado a `get_dealership_public_by_slug`), para o `anon` não depender de política `SELECT` em `dealerships` durante a resolução do host. **Reforço:** `supabase/migrations/20260508254500_resolve_dealership_id_by_host_impl_row_security_off.sql` — `perform set_config('row_security', 'off', true)` no início do corpo da função (executado como dono da função no Supabase), para eliminar `null` persistente quando RLS ainda bloqueava o `SELECT` interno. **Sufixo do host (2026-05-08):** `supabase/migrations/20260508262000_host_resolver_platform_suffix_without_like.sql` — deixa de se usar `LIKE '%.' || v_root` para validar subdomínio da plataforma; usa `right(v_host, char_length(v_root)+1) = '.' || v_root` (evita falsos `null` em alguns ambientes). **Dono das funções (2026-05-08):** `supabase/migrations/20260508263500_resolve_host_impl_owner_matches_dealerships.sql` — `ALTER FUNCTION ... OWNER TO` o mesmo papel que possui `public.dealerships`, para os `SELECT` em `SECURITY DEFINER` beneficiarem do bypass de RLS do dono da tabela (sem isto, o papel dono da função migrada não tem política `authenticated` e o resolver devolve sempre `null`). **Estado `status` normalizado (2026-05-08):** `supabase/migrations/20260508265000_resolve_host_status_trim_and_positional_delegate.sql` — filtro `lower(trim(d.status)) = 'active'` na vitrine e delegate `public` com `$1,$2` (evita `status` com espaços invisíveis e edge cases no corpo SQL). **Port no Host / regexp PostgreSQL (2026-05-12):** `supabase/migrations/20260512184500_host_resolver_strip_port_posix_digit_class.sql` — remove sufixo `:porta` com `:[0-9]+$` em vez de `:\\d+$`: num literal SQL não‑E, `\d` não é classe de dígitos, pelo que `guiotti.localhost:3002` ficava sem normalizar e as RPC devolviam `null`. As apps (`dealership-panel`, `customer-site`) enviam também `p_host` sem porta (`normalizeHost`).

- **Painel — bootstrap opcional por path:** rota `apps/dealership-panel/src/app/painel/acesso/[slug]/route.ts` só quando **`NEXT_PUBLIC_ENABLE_DEALERSHIP_PANEL_SLUG_BOOTSTRAP=true`**; middleware `cookie` + RPC dashboard; helper `packages/shared/src/lib/tenant/allow-cookie-tenant-fallback-host.ts`. **Admin Master — `DealershipOperatorSurfaceLinks`:** em `NODE_ENV=development`, os botões principais usam **`buildLocalhostDealershipPreviewUrls`** (`packages/shared/src/lib/tenant/dealership-subdomain-surface-urls.ts`) para `http://{slug}.localhost:{3002|3003}`, mesmo quando **`NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`** já é o domínio de produção — evita abrir `https://{slug}.{root}` sem serviço local; bloco monospace opcional mostra URL canónico de **`buildDealershipSubdomainSurfaceUrls`**. Produção (`NODE_ENV=production`): só URLs canónicos.

#### UX (Passo B — tabs sugeridas)

`Tabs` (`@autopainel/shared/ui`): **Geral** | **Whitelabel** | **Módulos** | **Pessoas colaboradoras** | **Financeiro**. Financeiro apenas visível quando `profiles.role = super_admin` no admin.

**Implementação actual (scroll único):** em `painel/concessionarias/[id]/editar`, formulário único financeiro («Cobrança comercial SaaS») desduplica vista: plano efetivo (catálogo + legado), estado de cobrança, período contractual, dígitos de mensalidades e histórico com upload de PDF/imagens aos registos (`saveDealershipCommercialFinanceAction`, anexos com `dealership-operator-billing`). Migrações: hub `20260508100000` + `20260508103000_dealership_billing_contract_attachments.sql`. Forms com ficheiro usam `onSubmit` + `FormData` (evitar `encType` em `<form>` com hidratação React 19) e `experimental.serverActions.bodySizeLimit`=`30mb` em `apps/admin-master/next.config.ts`.

**CNPJ opcional (`public.dealerships.cnpj`):** migração de reparação `supabase/migrations/20260508153000_dealerships_ensure_cnpj_column.sql` (coluna nullable + índice único parcial). Em `createDealershipAction` (`apps/admin-master/src/actions/dealerships.ts`), a propriedade `cnpj` só entra no `insert` quando há exatamente 14 dígitos — sem `cnpj: null`, evita falha «schema cache» em bases onde a coluna ainda não estava aplicada ao guardar concessionária sem CNPJ.

**Colunas whitelabel (`theme_config`, `content_config`, `enabled_features`):** migração de reparação `supabase/migrations/20260508203000_dealerships_ensure_theme_content_enabled_columns.sql` quando o remoto nunca aplicou `20260423120000_admin_rbac_theme_leads.sql` — evita erro PostgREST «Could not find the 'content_config' column… in the schema cache» ao criar concessionárias.

**Convite colaboradores / login painel da loja:** `apps/admin-master/src/actions/dealership-collaborators.ts` — `inviteDealershipCollaboratorAction` usa `auth.admin.createUser` ou, se o e-mail já existe no Auth, associa `profiles` à concessionária (recusa `super_admin` ou e-mail já ligado a outra loja). Para envio automático de e‑mail de recuperação quando se liga conta existente: `NEXT_PUBLIC_DEALERSHIP_AUTH_REDIRECT_ORIGIN` + Redirect URLs no Supabase. No `dealership-panel`: rotas `/recuperar-senha`, `/auth/confirm` (código PKCE), `/definir-senha`. Quem não tem `profiles` para o tenant continua bloqueado (`requireDashboardSession` → `/erro/concessionaria`).

**Hardening segurança Supabase (Advisor):** `supabase/migrations/20260508164500_security_advisor_hardening.sql` — remove policy de listagem no bucket público `dealership-branding`, move `current_profile_*` para schema `private` (não exposto no REST por defeito), políticas explícitas «deny» em `dealership_meta_credentials` / `dealership_classifieds_credentials`, trigger `dealerships_block_tenant_plan_feature_updates` em `SECURITY INVOKER`, revoga `anon` em `disconnect_dealership_meta_connection`. **`supabase/migrations/20260508201500_rpc_security_invoker_wrappers.sql`:** RPC de vitrine/dashboard (`effective_feature_keys_*`, resolução de host/slug, `get_public_vehicle_by_id`, `disconnect_meta`) — wrappers `SECURITY INVOKER` em `public` e implementação em `private.*_impl` para o Advisor deixar de marcar DEFINER nas entradas expostas. Proteção de passwords vazadas (HIBP): ativar no Dashboard **Authentication** conforme `packages/shared/docs/SUPABASE_TYPES.md`.

#### Middleware / sessão dashboard

- **`requireDashboardSession`** (painel): após validar perfil ≠ cookie tenant, ler `dealerships.status`; se **`status <> 'active'`** ⇒ `redirect('/conta-inativa')`.
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
