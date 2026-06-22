# Subdomínios por loja e OAuth por concessionária

Documento de desenho (arquitectura + plano de entrega). Alinhado com o código em `resolve_dealership_id_from_host` e migrações `dealership_meta_*` / `dealership_classifieds_*`.

## 1. Resumo

| Tema | Estado actual | Direcção |
|------|----------------|----------|
| **Host → loja** | RPC `resolve_dealership_id_by_host(_for_dashboard)` usa `custom_domain` ou subdomínio do slug em `dealerships.slug` vs `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` | Manter; em local usar `slug.localhost` com `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=localhost` |
| **DEV single-tenant** | `DEVELOPMENT_TENANT_SLUG` forçava uma loja em *qualquer* variante de localhost | Corrigido: só `localhost` / `127.0.0.1` “nu”; `*.localhost` resolve por subdomínio |
| **Meta** | `.env` global `META_APP_*` | Produção: credenciais da **app** podem ser da concessionária (DB) ou app AutoPainel **uma vez** + tokens por loja (já previsto) — ver §3 |
| **OLX / WebMotors** | `.env` global `OLX_*` / `WEBMOTORS_*` | Deve passar a **OAuth app por loja** na base de dados + callback com `state`/`dealership_id` |

---

## 2. Subdomínios: modelo completo

### 2.1 Regra de resolução (já na base)

1. **Domínio próprio** (`dealerships.custom_domain`) — bate exacto com o host (sem porta).
2. Senão: se `host` = `subdomínio` + `.` + `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`, então `subdomínio` = primeiro rótulo do host e deve igualar `dealerships.slug`.

Funções: `resolve_dealership_id_by_host` (vitrine, só `status=active`) e `resolve_dealership_id_by_host_for_dashboard` (painel, ignora status).

A partir da migração `20260508240000_resolve_dealership_host_slug_ci.sql`, a comparação do `slug` na base com o subdomínio derivado do host usa `lower(trim(d.slug))` (equivalente funcional no dashboard), evitando falhas só por diferença de maiúsculas/minúsculas.

### 2.2 Desenvolvimento local (multi-loja)

**Sem** DNS real: browsers resolvem `qualquercoisa.localhost` → `127.0.0.1` (RFC 6761). Ex.: `{slug}.localhost:3002`.

**`.env.local` recomendado para multi-tenant local:**

```bash
NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=localhost
# Opcional: reutilizar cookie de tenant no painel quando abras pelo IP da LAN (ex.: 192.168.x.x:3002).
# NEXT_PUBLIC_ALLOW_LAN_HOST_TENANT_COOKIE=true
# Legado (vitrine / fluxos antigos): só se ainda precisares de forçar slug em localhost nu.
# NEXT_PUBLIC_DEVELOPMENT_TENANT_SLUG=
# DEVELOPMENT_TENANT_SLUG=
```

- Com **`NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=localhost`**, o host `{slug}.localhost` faz corresponder o primeiro segmento a `dealerships.slug` e a RPC devolve o `dealerships.id`.

### 2.2.0 Painel — várias lojas (`N` tenants) sem slug único no `.env`

- **`dealership-panel`:** produção não expõe formulário público de slug. Operadores do Admin Master usam o cartão **«Abrir vitrine e painel desta concessionária»** em `painel/concessionarias/[id]/editar`. Em **`NODE_ENV=development`**, os botões principais usam **`buildLocalhostDealershipPreviewUrls`** (`http://{slug}.localhost:{3002|3003}`) mesmo quando **`NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`** já é o domínio de produção; um bloco opcional mostra os URL canónicos de **`buildDealershipSubdomainSurfaceUrls`**. Em builds de produção do Admin, só os canónicos (ex.: **`https://{slug}.{NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN}`** quando a raiz não é `localhost`). Opcionalmente em desenvolvimento, **`NEXT_PUBLIC_ENABLE_DEALERSHIP_PANEL_SLUG_BOOTSTRAP=true`** activa **`GET /painel/acesso/:slug`** — mantém-se **desligado** em ambientes públicos.
- Em **`localhost`/loopback**, o middleware também aceita cookie já válido após visita ao host canónico; com IP LAN, opt-in **`NEXT_PUBLIC_ALLOW_LAN_HOST_TENANT_COOKIE`** (não substitui isolamento por host em prod).
- Produção: canónico **`slug.dominio`** + **`custom_domain`** (wildcard TLS).
- **`customer-site`:** continua orientada ao **`Host`** (`resolve_dealership_id_by_host`).

### 2.2.1 Falha de resolução — rota `/erro/concessionaria`

Se as RPCs de resolução devolverem `null` (host não mapeado, `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` vazio/incorrecto, slug inexistente, ou — na vitrine — loja não `active`), o middleware redirecciona para **`/erro/concessionaria`** em **`customer-site`** e **`dealership-panel`**. A UI pública exibe apenas **«Loja não encontrada»** + CTA para **`https://autopainel.com.br`** (`StoreNotFoundPage` em `@autopainel/shared/components/system/store-not-found-page`) — **sem** checklist de desenvolvimento, variáveis de ambiente ou referências à stack. Checklist operacional para devs: secção «Resolução de host» em `documentacao-tecnica.md`. **Código (2026):** `resolveEffectivePlatformRootDomain` (`@autopainel/shared/lib/tenant/effective-platform-root-domain`) devolve **`localhost`** sempre que o `Host` (sem porta) for **`{slug}.localhost`** — **antes** de usar `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`, para que `{slug}.localhost:3002` resolva na BD mesmo com o env já definido como `autopainel.com.br` (dev típico). Se a variável pública faltar no Edge e o host for `*.localhost`, o resultado continua `localhost` para as RPCs `resolve_dealership_id_by_host*`. **Importante:** o `Host` pode incluir porta (`{slug}.localhost:3002`). Nas funções Postgres, remover `:porta` com o padrão `:[0-9]+$` (migração `20260512184500_*`): num literal SQL normal, `\d` **não** é classe de dígitos sem prefixo `E`, pelo que `:3002` podia ficar no texto e invalidar o sufixo da plataforma. Regras de produto: **BZ-TERR-*** em `apps/admin-master/content/internal-docs/regras-de-negocio.md`; contrato e ficheiros em `apps/admin-master/content/internal-docs/documentacao-tecnica.md` (secção «Resolução de host»).

### 2.3 Produção (ex.: `{slug}.autopainel.com.br`)

```bash
NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=autopainel.com.br
```

Garantir em `public.dealerships` que cada loja tem `slug` único por tenant. SSL wildcard `*.autopainel.com.br` no DNS.

### 2.4 Vercel (plano de migração)

| Passo | Acção |
|-------|--------|
| 1 | Mesmo repositório; variáveis de ambiente por ambiente (Preview / Production). |
| 2 | Domínio raiz `autopainel.com.br` e wildcard `*.autopainel.com.br` apontando para o project Vercel (ou subdomínio que definirem). |
| 3 | Em **cada** app Next (`admin-master`, `dealership-panel`, `customer-site`, `marketing-site`), configurar o domínio correspondente ou usar o mesmo project com rotas — o importante é o **Host** HTTP que chega ao middleware. |
| 4 | `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` = domínio raiz **sem** subdomínio (ex. `autopainel.com.br`). |
| 5 | Supabase Auth: Redirect URLs com `https://{slug}.autopainel.com.br/auth/confirm` (e variantes por app). |
| 6 | Testar primeiro em **Preview** com domínio de preview Vercel ou domínio de teste. |

**Nota:** Se cada app estiver num project Vercel diferente, cada um tem o seu URL; o `Host` que o browser envia deve continuar a ser `{slug}.autopainel.com.br` para o cookie de tenant — normalmente um **único** hostname por “superfície” (ex.: painel num projeto que serve só `*.autopainel.com.br/painel`) ou **vários** projetos com o **mesmo** wildcard configurado (avaliar custos e caching).

---

## 3. OAuth: credenciais da loja vs da AutoPainel

### 3.1 Classificados (OLX / WebMotors)

**Premissa:** cada parceiro / loja pode ter `client_id` e `client_secret` **próprios** no programa do classificado.

**Modelo de dados (evolução):**

- Nova tabela (ex.) `dealership_classifieds_oauth_apps` **ou** colunas JSON em `dealership_classifieds_connections`:
  - `dealership_id`, `provider` (`olx` | `webmotors`)
  - `oauth_client_id` (texto; pode ser público)
  - `oauth_client_secret_encrypted` (só ciphertext)
  - Opcional: `authorization_url`, `token_url` (se variarem por parceiro; caso contrário constantes por provider no código ou tabela de catálogo).

**Segredo de plataforma (único no `.env` / Supabase secrets):**

- `CLASSIFIEDS_TOKENS_CRYPTO_SECRET` — apenas para **encriptar** secrets e tokens em repouso; **não** substitui o `client_secret` da OLX.

**Fluxo OAuth:**

1. Painel chama `POST /api/.../oauth/start` com sessão JWT; infere `dealership_id` do perfil.
2. Lê `oauth_client_id` + secret desencriptado **só no servidor** (ou Edge com service role), monta URL de autorização.
3. `state` assinado ou payload com `dealership_id` + `provider` + nonce; grava em `dealership_classifieds_oauth_sessions` (já existe).
4. Callback único: `https://<proj>.supabase.co/functions/v1/classifieds-oauth-callback?provider=olx` trocando `code` com **client_id/secret dessa linha**.

**Fallback dev:** manter variáveis globais opcionais só para QA até à migração DB estar estável.

### 3.2 Meta (Facebook / Instagram)

**Decisão de produto (2026-05-08):** integração **por concessionária**. A aplicação em Meta for Developers é **do cliente**; credenciais em `dealership_meta_oauth_apps`. Variáveis globais `META_APP_*` são **opcionais** em produção e servem como fallback de desenvolvimento.

| Modelo | Descrição |
|--------|------------|
| **Produção** | `dealership_meta_oauth_apps`: `meta_app_id` + `meta_app_secret_encrypted` por loja; OAuth e token exchange usam esta linha; futuras chamadas Graph usam **tokens dessa loja**.
| **Dev** | `META_APP_CLIENT_ID` / `META_APP_CLIENT_SECRET` no `.env` se a linha na BD ainda não existir. |

Implementação: rota `meta/oauth/start` + Edge `meta-oauth-callback` resolvem BD primeiro; formulário no painel **Integrações** para gravar App ID/Secret.

Dois modelos possíveis (histórico de desenho — **produção segue linha «app do cliente» acima):

| Modelo | Quando usar | `.env` / DB |
|--------|-------------|------------|
| **A — App Meta da AutoPainel** | *Não adotado para produção após decisão 2026-05-08* | — |
| **B — App Meta por concessionária** | **Em produto** | `dealership_meta_oauth_apps` |

---

## 4. Segurança e RLS

- Leitura/escrita de `oauth_client_secret` apenas **service role** ou Edge com secret; nunca JWT tenant lê ciphertext (políticas já no sentido “deny” para credenciais).
- UI no **painel da loja** ou **admin master** para colar App ID / Secret (como Stripe Connect): validar `profiles.dealership_id`.

---

## 5. Plano de implementação sugerido (épico)

1. **Subdomínio local** — ajuste `DEVELOPMENT_TENANT_SLUG` + documentação `.env` (este repo).
2. **Migração SQL** — `supabase/migrations/20260508220000_dealership_classifieds_oauth_apps.sql` (credenciais app por loja); refactor Edge + UI a seguir.
3. **Refactor Edge `classifieds-oauth-callback`** — **feito (2026-05-08):** `resolveProviderRuntimeConfig` lê `dealership_classifieds_oauth_apps` com decrypt AES-GCM; fallback env quando não há linha.
4. **Refactor `oauth/start` e `oauth-provider.ts`** — **feito (2026-05-08):** `resolve-classifieds-oauth-config.ts` faz merge service-role + env antes do insert da sessão.
5. **Meta (app por concessionária)** — **feito (2026-05-08):** migração `20260508231000_dealership_meta_oauth_apps.sql`, formulário + action no `dealership-panel`, `resolve-meta-oauth-start`, Edge `meta-oauth-callback` com `resolveMetaAppRuntimeConfig`.
6. **Vercel** — variáveis + wildcard DNS + redirects Supabase quando domínio real existir.

**Próximo (classificados):** formulário OLX/WebMotors para `dealership_classifieds_oauth_apps` (espelhar o Meta). **Jobs de publicação:** quando existirem, devem consumir **tokens já guardados** por `dealership_id` (nunca um `META_APP_*` global em produção).

---

## 6. Referências no repositório

- Resolução host: `apps/*/src/lib/tenant/resolve-dealership-id-from-host.ts` + `@autopainel/shared/lib/tenant/effective-platform-root-domain`
- RPC: `supabase/migrations/20260508100000_dealership_management_hub_scaffold.sql` (`resolve_dealership_id_by_host_for_dashboard`)
- Slug case-insensitive / storefront: `supabase/migrations/20260508240000_resolve_dealership_host_slug_ci.sql`
- Storefront host resolver + RLS + dono: `supabase/migrations/20260508253000_*.sql`, `20260508254500_*.sql`, `20260508262000_*.sql`, `20260508263500_resolve_host_impl_owner_matches_dealerships.sql`
- Páginas tenant não resolvido: `apps/dealership-panel/src/app/erro/concessionaria/page.tsx`, `apps/customer-site/src/app/erro/concessionaria/page.tsx`
- Classificados: `20260507123000_classifieds_sync_oauth_scaffold.sql`
- Meta: `20260507140000_social_media_meta_oauth_scaffold.sql`

---

## 7. Revisão da squad (PM → UX → Architect / Backend → Frontend → QA)

Síntese de revisão por função, com **melhorias** incorporadas ao desenho. Ordem obrigatória do workflow: não avançar UI pesada antes de contratos (Architect) nem fechar produto sem critérios de aceite (PM) e matriz QA.

### 7.1 Product Manager (PM)

**Problema:** credenciais OLX / WebMotors / Meta não podem ser um único segredo da AutoPainel; cada concessionária pode (ou deve) usar a **sua** aplicação OAuth nos portais. O acesso à loja deve ser por **identidade de host** natural (subdomínio ou domínio próprio), não um “slug único global” em dev.

**Regras de negócio (rascunho testável)**

| ID | Regra |
| --- | --- |
| BZ-T1 | Cada `dealerships.slug` é **único** na plataforma e corresponde ao subdomínio em `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`, salvo quando `custom_domain` tem prioridade. |
| BZ-T2 | Se a loja tiver `custom_domain` configurado e validado, o host **exacto** desse domínio resolve a loja antes do subdomínio da plataforma. |
| BZ-T3 | Integrações classificadas e Meta **só** aparecem na UI se o módulo (`saas_modules`) estiver no plano efetivo da loja (já alinhado ao gating existente). |
| BZ-T4 | Armazenar/fornecer **client_id** e **client_secret** da app do parceiro é responsabilidade da **concessionária** (ou onboarding assistido); a AutoPainel apenas guarda ciphertext e executa o fluxo OAuth. |
| BZ-T5 | Rotação ou revogação: o gestor da loja deve poder **desligar** a integração e apagar tokens (fluxos já previstos parcialmente; manter paridade entre Meta e classificados). |

**Cenários de aceite (Given / When / Then)**

1. **Subdomínio produção:** Dado `slug=acme` e `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=autopainel.com.br`, quando o cliente abre `https://acme.autopainel.com.br/painel`, então o painel resolve o mesmo `dealership_id` que na base.
2. **Local multi-loja:** Dado `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=localhost`, quando abre `http://loja-a.localhost:3002` e `http://loja-b.localhost:3003`, então cada host resolve a loja cujo `slug` corresponde ao primeiro rótulo (e não a `DEVELOPMENT_TENANT_SLUG`).
3. **OAuth OLX por loja:** Dado credenciais guardadas para `dealership_id=X` e provider `olx`, quando o callback Edge troca `code`, então os tokens ficam associados **só** a `X` e não a outra loja.
4. **Cross-tenant negativo:** Dado utilizador JWT da loja A, quando tenta iniciar OAuth com `state` manipulado para loja B, então o fluxo falha (validação server-side do `state`/sessão).

**Decisão PM (2026-05-08):** Meta **modelo B** — app Meta **da concessionária**; ver §3.2 e `regras-de-negocio.md`.

**Melhorias PM neste doc:** BZ numerados, cenários de aceite explícitos, decisão A/B Meta rastreável.

---

### 7.2 UX / UI

**Jornadas**

| Persona | Jornada |
| --- | --- |
| Gestor da loja | Integrações → Classificados (OLX / WebMotors) → inserir App ID + Secret (ou só “Conectar” se modelo A e segredo global) → popup OAuth → estado **Conectado** / **Reautenticação necessária** / **Erro** com mensagem clara em PT. |
| Gestor da loja | Integrações → Meta → idem; mostrar Página / IG ligados quando existir metadados. |
| Operador AutoPainel | Admin → concessionária: ver **slug** e aviso se colidir com outra; opcional futuro “domínio próprio” já existe no modelo de dados. |
| Visitante | Apenas vitrine no `customer-site`; não gere secrets. |

**Estados de ecrã**

- **Vazio:** módulo comprado mas sem credenciais OAuth da app → CTA “Configurar credenciais do portal” + link de ajuda (docs do OLX/WebMotors).
- **Connecting:** desactivar duplo clique em “Conectar” (idempotência visual).
- **Erro:** mostrar motivo sanitizado (não vazar stack); “Tentar novamente” + “Desligar”.
- **Reauth:** destacar token expirado; botão “Renovar ligação”.

**Consistência:** usar shells existentes (`dealership-panel`), `@autopainel/shared/ui`, formulários com validação acessível; copy só em **português** (rotas já em PT).

**Melhorias UX neste doc:** matriz persona/jornada; estados vazios e erro; anti-duplo-envio no OAuth.

---

### 7.3 Architect + Backend

**Contrato API-first (antes de UI final)**

- Expor tipos TypeScript em `packages/shared` para: payload de “guardar credenciais OAuth app” (sem nunca devolver `client_secret` ao browser); resposta de estado de conexão já alinhada às tabelas `dealership_*_connections`.
- Edge Functions: callback **único** por integração (`classifieds-oauth-callback`, `meta-oauth-callback`) com `state` → lookup em `dealership_classifieds_oauth_sessions` / equivalente Meta; **nunca** confiar só no `dealership_id` vindo do query string sem validar contra sessão assinada.
- **Encriptação:** reutilizar padrão AES-GCM já usado para tokens; **rotação do segredo de plataforma** documentada (re-encriptar blobs — backlog se produto exigir).

**Esquema de dados (incremento sugerido)**

- Tabela `dealership_classifieds_oauth_apps` (`dealership_id`, `provider`, `oauth_client_id`, `oauth_client_secret_encrypted`, `created_at`, `updated_at`) com UNIQUE (`dealership_id`, `provider`).
- Para **Meta:** tabela **`dealership_meta_oauth_apps`** (feito).
- **RLS:** sem SELECT de ciphertext para `authenticated`; inserção/update de credenciais apenas com política que verifica `profiles.dealership_id` e papel `owner|manager` (reutilizar padrões do hub).

**Vercel / domínios**

- Cookies `Host-` only: confirmar que cookies de tenant no middleware não usam `Domain=` errado em preview (`vercel.app` vs domínio wildcard). Documentar teste em Preview com hostname de branch quando possível.
- **Redirect URIs** OAuth: mantêm-se **estáveis** por ambiente (Edge URL Supabase); variam por projeto Supabase, não por loja — o **tenant** vem sempre do `state`, não do redirect URI.

**Melhorias backend neste doc:** tabela explícita para apps classificados; regra “state é fonte da verdade do tenant”; aviso cookies multi-domínio na Vercel.

---

### 7.4 Frontend

**Ordem de implementação sugerida**

1. Formulário “Credenciais do portal” no painel (só após migração + RLS).
2. Ajustar rotas `oauth/start` para: ler credenciais da BD via Server Action ou route handler com sessão; fallback env global para dev.
3. Garantir que **todos** os links “voltar ao painel” usam o **mesmo host** actual (`{slug}.localhost` em dev → não redirecionar para `localhost` sem querer).
4. Variáveis `NEXT_PUBLIC_*` documentadas por app (`customer-site` vs `dealership-panel` portas diferentes — já notório no monorepo).

**Melhorias frontend neste doc:** redirect pós-OAuth respeita host; ordem de entrega dependente de backend.

---

### 7.5 QA

| Área | Casos |
| --- | --- |
| Resolução host | `custom_domain` vs subdomínio; slug inexistente → 404 ou página de erro acordada. |
| Isolamento | Dois browsers, duas lojas, tokens não misturam (validar por `dealership_id` nas tabelas após OAuth). |
| Segurança | Tentativa de callback com `state` expirado ou reutilizado; SQL injection em slug (caracteres permitidos no slug). |
| Regressão | `DEVELOPMENT_TENANT_SLUG` ainda funciona em `http://localhost` nu. |
| Auth Supabase | Redirect URLs incluem `*.localhost` e wildcard prod quando existir. |

**Melhorias QA neste doc:** matriz explícita + regressão dev slug.

---

### 7.6 Sprint review (entregáveis deste épico)

| Entregável | Dono |
| --- | --- |
| Migração(s) SQL + RLS | Backend |
| Edge callbacks + start routes | Backend / plataforma |
| UI credenciais + integração | Frontend |
| Actualização `SUPABASE_TYPES.md` + testes manuais QA | Todos |
| Decisão Meta A vs B registada em `regras-de-negocio.md` | PM — **fechado 2026-05-08 (modelo B)** |

**Risco principal:** aprovação de apps OAuth nos portais externos (OLX/WebMotors/Meta) depende do cliente — pré-requisito de projeto, não só de código.

---

## 8. Changelog deste documento

| Data | Alteração |
| --- | --- |
| 2026-05-08 | Migração `20260508265000` — `lower(trim(d.status)) = 'active'` + delegate `$1,$2`. |
| 2026-05-08 | Migração `20260508263500` — dono de `private.resolve_*_impl` alinhado ao dono de `dealerships` (RLS). |
| 2026-05-08 | Migração `20260508253000` — `resolve_dealership_id_by_host`: delegate INVOKER + `private.resolve_dealership_id_by_host_impl` (evita `null` por RLS com `anon`). |
| 2026-05-08 | Revisão squad §7; melhorias BZ, UX, backend, frontend, QA. |
| 2026-05-08 | Migração `20260508220000_dealership_classifieds_oauth_apps.sql` + tipos `classifieds-oauth-app.ts`. |
| 2026-05-08 | **Meta app por loja:** migração `20260508231000`, formulário painel, `resolve-meta-oauth-start`, refactor Edge `meta-oauth-callback`; PM decisão modelo B em `regras-de-negocio.md`. |
