# Credenciais OAuth — classificados (OLX, WebMotors, iCarros)

Guia para homologar conexão **real** no painel da loja. O fluxo de popup já está implementado; falta registrar o app no portal e preencher secrets.

**Projeto Supabase:** `wcgevmvystdhqpzwuyig`

---

## 0. Corrigir dev stub (local)

Se o popup abre mas a UI não mostra «Conectado»:

1. Confirme `CLASSIFIEDS_OAUTH_DEV_STUB=true` e `CLASSIFIEDS_TOKENS_CRYPTO_SECRET` em `.env.local`
2. `npm run sync:env` + reinicie `npm run dev:all`
3. `npm run classifieds:oauth:dev:configure`

O bug `noopener` no popup foi removido — o callback envia `postMessage` ao painel e consulta status ao fechar a janela.

### 0.1 Localhost + OLX real (importante)

Com `CLASSIFIEDS_OAUTH_DEV_STUB=false`, o callback OAuth aponta para a **Edge remota** (`wcgevmvystdhqpzwuyig.supabase.co`). A sessão OAuth **tem de existir no mesmo projeto Postgres**.

| Cenário | Config |
| --- | --- |
| **Simular login local** | `CLASSIFIEDS_OAUTH_DEV_STUB=true` + Supabase local (`127.0.0.1:54321`) |
| **OLX real em localhost** | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` do **projeto remoto** (não use `127.0.0.1:54321`) |
| **OLX real em produção** | Vercel já usa o projeto remoto — conectar em `{slug}.loja.autopainel.com.br` |

Se `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` e `OLX_OAUTH_REDIRECT_URI` remoto, o painel grava sessão local e o callback remoto não encontra → erro `session_invalid`. O painel bloqueia esse fluxo com mensagem explícita (`oauth_session_store_mismatch`).

---

## 1. OLX — OAuth2 authorization code (suportado hoje)

Documentação oficial: [developers.olx.com.br — OAuth](https://developers.olx.com.br/anuncio/api/oauth.html)

### 1.1 Homologação do integrador

1. Ler o manual e solicitar homologação via chat no final da página ou e-mail **suporteintegrador@olxbr.com**
2. Enviar os dados da secção **1.1.1** abaixo (ajuste telefone/e-mail/CNPJ da empresa)
3. Receber `client_id` e `client_secret` após aprovação
4. Conta OLX da loja precisa de **plano profissional Empresa** com API habilitada (planos autônomo não permitem integração)

#### 1.1.1 Modelo de cadastro (copiar para suporteintegrador@olxbr.com)

| Campo OLX | Valor sugerido |
| --- | --- |
| **Nome do integrador** | AutoPainel |
| **Nome da aplicação** | AutoPainel — Integração OLX |
| **Descrição da aplicação** | Plataforma SaaS multitenant para concessionárias e lojas de veículos no Brasil. A integração permite que o gestor da loja autorize, via OAuth, a publicação, atualização e baixa automática de anúncios de veículos na OLX a partir do estoque cadastrado no painel AutoPainel. Cada lojista conecta a própria conta OLX; tokens ficam cifrados por concessionária. |
| **Website** | https://autopainel.com.br |
| **Telefone** | *(DDD + número comercial — preencher)* |
| **E-mail** | *(e-mail do responsável técnico/comercial — preencher)* |
| **URLs de redirecionamento (1–3)** | Ver §1.3 — usar **exatamente** a URL de produção; opcional homolog se a OLX exigir segundo ambiente |

**Assunto sugerido do e-mail:** `Homologação integrador AutoPainel — API autoupload (OAuth)`

**Corpo (rascunho):**

> Prezados,
>
> Solicitamos homologação do integrador **AutoPainel** para a API de importação de anúncios (scope `autoupload`).
>
> - Nome do integrador: AutoPainel  
> - Nome da aplicação: AutoPainel — Integração OLX  
> - Website: https://autopainel.com.br  
> - Telefone: [seu telefone]  
> - E-mail: [seu e-mail]  
> - URL de redirecionamento: `https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback`
>
> Descrição: plataforma para concessionárias conectarem a conta OLX da loja e sincronizarem anúncios com o estoque do painel.
>
> Atenciosamente,  
> [Nome] — AutoPainel


### 1.2 URLs fixas OLX

| Campo | Valor |
| --- | --- |
| Authorization | `https://auth.olx.com.br/oauth` |
| Token | `https://auth.olx.com.br/oauth/token` |
| Scope (anúncios) | `autoupload` |
| API publish (worker) | `https://apps.olx.com.br/autoupload/import` |
| PKCE | **Não usar** — OLX usa authorization_code clássico (`client_id` + `client_secret` + `redirect_uri` idêntico no authorize e no token) |

### 1.3 Redirect URI (callback)

Registrar **exatamente** esta URL na OLX (produção) — **sem** `?provider=` (a OLX substitui a query inteira no redirect; o portal vai no parâmetro `state`):

```text
https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback
```

Local (Supabase Docker + Edge):

```text
http://127.0.0.1:54321/functions/v1/classifieds-oauth-callback
```

### 1.4 Variáveis `.env.local` (raiz)

```env
# Desligar stub quando usar OLX real
CLASSIFIEDS_OAUTH_DEV_STUB=false

CLASSIFIEDS_TOKENS_CRYPTO_SECRET=<32+ chars aleatórios — mesmo valor no Edge>
CLASSIFIEDS_SYNC_DRY_RUN=true

OLX_OAUTH_AUTHORIZATION_URL=https://auth.olx.com.br/oauth
OLX_OAUTH_TOKEN_URL=https://auth.olx.com.br/oauth/token
OLX_OAUTH_CLIENT_ID=<da OLX>
OLX_OAUTH_CLIENT_SECRET=<da OLX>
OLX_OAUTH_SCOPE=autoupload
OLX_OAUTH_REDIRECT_URI=https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback
OLX_LISTINGS_API_URL=https://apps.olx.com.br/autoupload/import
# Fallbacks quando unidade/loja não tem CEP ou WhatsApp (somente dígitos)
# OLX_FALLBACK_PHONE=11999999999
# OLX_FALLBACK_ZIPCODE=01310100
```

Depois:

```bash
npm run sync:env
npm run classifieds:oauth:platform:configure    # gera SQL platform_classifieds_oauth_providers
npm run classifieds:oauth:platform:configure -- --apply-local   # só Supabase local
npm run classifieds:oauth:secrets:configure     # secrets Edge
supabase functions deploy classifieds-oauth-callback --project-ref wcgevmvystdhqpzwuyig --no-verify-jwt
```

Aplicar o SQL gerado em `supabase/.generated-platform-classifieds-oauth.sql` no Dashboard remoto se não usar `--apply-local`.

### 1.5 Teste conexão OAuth

1. Loja enterprise com módulo `olx_sync` (ex.: Guiotti)
2. `/painel/integracoes` → Conectar OLX → login **real** OLX
3. Badge **Conectado**; tokens em `dealership_classifieds_credentials` (cifrados)

### 1.6 Publicação real (INT-5)

Com `CLASSIFIEDS_SYNC_DRY_RUN=false` na **Edge** (`classifieds-sync-worker`):

| Pré-requisito | Detalhe |
| --- | --- |
| OLX conectada | OAuth com scope `autoupload` |
| Veículo | Disponível, ativo, ≥1 foto, marca/modelo/versão alinhados ao catálogo OLX |
| Loja | WhatsApp da concessionária **ou** `OLX_FALLBACK_PHONE` |
| Unidade | CEP no endereço da unidade **ou** `OLX_FALLBACK_ZIPCODE` |
| Worker | `supabase functions deploy classifieds-sync-worker --no-verify-jwt` |

Fluxo técnico: `PUT https://apps.olx.com.br/autoupload/import` com `ad_list` (insert/delete). Marca/modelo/versão resolvidos via `car_info`/`moto_info`. Token renovado automaticamente antes do job quando `expires_at` estiver próximo (INT-4); falha de refresh ⇒ status `reauth_required`.

Para homologação inicial, mantenha `CLASSIFIEDS_SYNC_DRY_RUN=true` até validar um veículo de teste com publish real.

---

## 2. WebMotors — API Site (password grant Sensedia)

Documentação oficial: [Manual Integração Revendedor](https://integracao.webmotors.com.br/manualintegracao/index.html) · [Portal Developers](https://portal-webmotors.sensedia.com/api-portal/documentacao/autenticacao)

A WebMotors **não** usa popup OAuth como a OLX.

| Aspecto | OLX | WebMotors |
| --- | --- | --- |
| Fluxo | Authorization code + popup | **Password grant** (Sensedia API Site) |
| Credencial AutoPainel | `client_id` + `client_secret` (app) | Idem — portal Sensedia |
| Credencial lojista | Login OLX (popup) | **Usuário Integrador de API** no Cockpit WebMotors |
| Token homolog | — | `https://hlg-webmotors.sensedia.com/oauth/v1/access-token` |
| Token produção | — | `https://api-webmotors.sensedia.com/oauth/v1/access-token` |
| Estoque homolog (pull API Site) | — | `https://hlg-webmotors.sensedia.com/site/v1/estoque` |
| Estoque homolog (push anúncio) | — | `https://hlg-webmotors.sensedia.com/estoque/v1` |
| Catálogo homolog | — | `https://hlg-webmotors.sensedia.com/catalogo/v1` |

### 2.0 Pré-requisito comercial (obrigatório)

> A utilização da **API Site** está condicionada à contratação de produto específico. **Antes de integrar**, o lojista deve contactar o representante comercial WebMotors e solicitar a aquisição do produto **API Site**.

Sem esse produto ativo na conta do lojista, o token ou a publicação podem falhar mesmo com credenciais de homologação corretas.

### 2.1 Homologação AutoPainel (integrador)

1. Registar app no [Portal WebMotors Developers](https://portal-webmotors.sensedia.com/api-portal/usuario/registrar)
2. Abrir chamado em **Suporte** pedindo liberação das APIs no ambiente de **homologação** (API Site + catálogo, se aplicável)
3. Receber `client_id` e `client_secret` da app AutoPainel
4. Configurar `.env.local` na raiz:

```env
CLASSIFIEDS_OAUTH_DEV_STUB=false
CLASSIFIEDS_SYNC_DRY_RUN=true

WEBMOTORS_OAUTH_TOKEN_URL=https://hlg-webmotors.sensedia.com/oauth/v1/access-token
WEBMOTORS_OAUTH_CLIENT_ID=<da Sensedia>
WEBMOTORS_OAUTH_CLIENT_SECRET=<da Sensedia>
WEBMOTORS_CATALOG_API_URL=https://hlg-webmotors.sensedia.com/catalogo/v1
WEBMOTORS_LISTINGS_API_URL=https://hlg-webmotors.sensedia.com/estoque/v1
```

5. Aplicar plataforma e secrets:

```bash
npm run classifieds:oauth:platform:configure
# Colar supabase/.generated-platform-classifieds-oauth.sql no Supabase Dashboard → SQL Editor (NÃO no terminal zsh)
npm run classifieds:oauth:secrets:configure
supabase functions deploy classifieds-sync-worker --project-ref wcgevmvystdhqpzwuyig --no-verify-jwt
```

6. Smoke do endpoint (só app + endpoint; usuário inválido = OK):

```bash
node scripts/smoke-webmotors-token.mjs
```

7. Smoke com integrador CRM real (credenciais que o lojista cria no Cockpit):

```bash
node scripts/smoke-webmotors-token.mjs usuario.integrador@loja.com.br senhaDoIntegrador
```

**Body de autenticação** (doc WebMotors):

```json
{
  "username": "site@webmotors.com.br",
  "password": "teste123",
  "integracaosite": "true",
  "grant_type": "password"
}
```

Header: `Authorization: Basic base64(client_id:client_secret)` + `Content-Type: application/json`.

**Horário homolog:** seg–sex 08h–20h (indisponível fins de semana e feriados). Credenciais de teste expiram em **90 dias** ou ao ir para produção.

### 2.2 Homologação por loja (lojista)

1. Contratar produto **API Site** com comercial WebMotors
2. No **Cockpit WebMotors**, criar usuário com perfil **Integrador de API**
3. Activar integração com AutoPainels (canal/gestor conforme instruções WebMotors)
4. No painel AutoPainel: `/painel/integracoes` → **WebMotors** → informar usuário e senha do integrador

**Implementado (INT-5b):** `POST /api/painel/integracoes/webmotors/connect`, `dealership_classifieds_integrator_accounts`, password grant Sensedia.

### 2.3 Publicação real (INT-5c)

**Implementado no worker** (`webmotors-adapter.ts`, `webmotors-catalog-resolve.ts`, `webmotors-api-client.ts`):

| Operação | Método | URL relativa (base = `WEBMOTORS_LISTINGS_API_URL`) |
| --- | --- | --- |
| Publicar | `POST` | `/anuncio` (override: `WEBMOTORS_LISTINGS_ANUNCIO_PATH`) |
| Atualizar | `PUT` | `/anuncio/{id}` |
| Remover | `DELETE` | `/anuncio/{id}` |

**Catálogo:** `GET {WEBMOTORS_CATALOG_API_URL}/salesforce/used` (override: `WEBMOTORS_CATALOG_USED_PATH`) — resolve `idMarca`, `idModelo`, `idVersao` a partir de marca/modelo/versão FIPE do veículo.

**Headers API:** `client_id` + `access_token` (doc Sensedia).

**Refresh token:** WebMotors não usa `refresh_token` OAuth clássico — ao expirar, o worker repete **password grant** com credenciais cifradas em `dealership_classifieds_integrator_accounts`.

**Ativar publish live:** `CLASSIFIEDS_SYNC_DRY_RUN=false` na Edge + redeploy `classifieds-sync-worker`.

**Bloqueios conhecidos (produto):**

- Lojista precisa contratar **API Site** + usuário **Integrador CRM** no Cockpit (§2.0).
- **Guiotti:** sem plano WebMotors contratado — aguardar comercial antes de homologar conectar/publicar live.
- **Simulador Santander** (`POST /financiamento/v1/simulacao`): fase 2 — manter simulador interno atual (`calculate-finance-simulation.ts`).

**QA recomendado (quando loja tiver plano):**

1. Conectar integrador em `/painel/integracoes`
2. Publicar veículo com marca/modelo/versão FIPE válidos — fila em dry-run primeiro
3. Validar payload no Cockpit WebMotors antes de `CLASSIFIEDS_SYNC_DRY_RUN=false`

### 2.4 Produção

Após homologação aprovada (evidências: listagem, publicação, status Publicado/Erro):

- Trocar URLs para `api-webmotors.sensedia.com`
- Re-correr `classifieds:oauth:platform:configure` + secrets + deploy worker
- `CLASSIFIEDS_SYNC_DRY_RUN=false` quando adapter real estiver pronto

---

## 3. iCarros — OAuth password grant

Documentação oficial (PDF/portal iCarros): fluxo **Resource Owner Password** com token em Keycloak.

### 3.0 Por que a URL do token «dá erro» no navegador?

A URL `https://accounts.icarros.com/auth/realms/icarros/protocol/openid-connect/token` é um **endpoint de API** (só aceita **POST** com `client_id`, `client_secret`, etc.). Abrir no Chrome/Firefox faz um **GET** e o iCarros responde com página genérica de erro — **comportamento esperado**, não indica credenciais inválidas.

Para testar, use `curl`:

```bash
curl -sS -X POST \
  'https://accounts.icarros.com/auth/realms/icarros/protocol/openid-connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=password' \
  -d 'username=SEU_LOGIN_ICARROS' \
  -d 'password=SUA_SENHA' \
  -d 'client_id=SEU_CLIENT_ID' \
  -d 'client_secret=SEU_CLIENT_SECRET' \
  -d 'scope=openid'
```

### 3.1 Como obter `client_id` e `client_secret` (AutoPainel — integrador)

**Não existe portal self-service.** A doc iCarros indica:

| Perfil | Como solicitar |
| --- | --- |
| **Integrador SaaS** (AutoPainel) | Contatar **equipe comercial iCarros** e pedir credenciais OAuth 2.0 para integração de estoque |
| **Revenda (lojista)** | Consultor comercial ou atendimento iCarros |

Essas credenciais são **da aplicação AutoPainel** (uma vez). O lojista só informa **login/senha iCarros** no painel ao conectar a loja.

**Depois de receber as credenciais**, configure:

1. `.env.local` (dev) ou secrets Edge (`npm run classifieds:oauth:secrets:configure`):
   - `ICARROS_OAUTH_CLIENT_ID`
   - `ICARROS_OAUTH_CLIENT_SECRET`
   - `ICARROS_OAUTH_TOKEN_URL` (confirmar com iCarros qual endpoint vale no seu contrato)
   - `ICARROS_OAUTH_SCOPE=openid` (Keycloak)
2. Tabela `platform_classifieds_oauth_providers`: `npm run classifieds:oauth:platform:configure` com `is_enabled=true`
3. `ICARROS_LISTINGS_API_URL` — pedir URL REST de anúncios na mesma homologação

> **Dois endpoints possíveis:** a doc em PDF costuma citar Keycloak (`accounts.icarros.com/.../token`). Alguns contratos usam `https://api.icarros.com.br/oauth-api/oauth/token`. **Confirme com o iCarros** qual aplicar — o código aceita override via `ICARROS_OAUTH_TOKEN_URL`.

### 3.2 Como funciona no AutoPainel

1. **Plataforma** guarda `client_id` / `client_secret` (env ou `platform_classifieds_oauth_providers`).
2. **Lojista** informa usuário/senha iCarros em `/painel/integracoes` — **sem popup**.
3. Backend faz `POST` no token URL e guarda tokens cifrados por loja.

### 3.3 URLs (doc anexa 2026)

| Campo | Valor (Keycloak — doc PDF) |
| --- | --- |
| Token | `https://accounts.icarros.com/auth/realms/icarros/protocol/openid-connect/token` |
| Password grant body | `grant_type=password`, `username`, `password`, `client_id`, `client_secret`, `scope=openid` |
| Alternativa | `https://api.icarros.com.br/oauth-api/oauth/token` (sem `scope` se o contrato indicar) |

### 3.4 Estado no código

| Item | Status |
| --- | --- |
| UI formulário login lojista | **Entregue (INT-3)** — `POST /api/painel/integracoes/icarros/connect` |
| Password grant + `scope=openid` | **Entregue** — `exchange-icarros-password-grant.ts` |
| Homologação credenciais reais | 🔴 pendente — depende do iCarros |

### 3.5 Modelo de pedido à central iCarros

Assunto: `Homologação integrador AutoPainel — OAuth estoque (password grant)`

> Solicitamos credenciais OAuth 2.0 (`client_id`, `client_secret`) para a aplicação **AutoPainel** (SaaS para concessionárias).
>
> - Website: https://autopainel.com.br  
> - Fluxo: **Resource Owner Password Credentials** (login do lojista por loja)  
> - Token endpoint: confirmar Keycloak ou `api.icarros.com.br/oauth-api/oauth/token`  
> - Escopo: publicação/gestão de estoque  
> - URL da API REST de anúncios (`ICARROS_LISTINGS_API_URL`)

---

## 3-alt. iCarros — popup OAuth Keycloak (não usar)

<details>
<summary>Scaffold legado — apenas referência</summary>

Authorization: `https://accounts.icarros.com/auth/realms/icarros/protocol/openid-connect/auth`  
Redirect: `.../classifieds-oauth-callback?provider=icarros`

</details>

---

## 4. Checklist produção (OLX)

| # | Item |
| --- | --- |
| 1 | Homologação OLX aprovada + redirect URI registrada |
| 2 | `platform_classifieds_oauth_providers` com `is_enabled=true` (script ou SQL) |
| 3 | Edge secrets: `CLASSIFIEDS_TOKENS_CRYPTO_SECRET`, `OLX_OAUTH_*` |
| 4 | Edge `classifieds-oauth-callback` deployada |
| 5 | `CLASSIFIEDS_OAUTH_DEV_STUB=false` no Vercel + Edge |
| 6 | Migração `20260611160000_classifieds_icarros_oauth_provider.sql` aplicada no remoto |
| 7 | iCarros: credenciais central + `is_enabled=true` — ver `CLASSIFIEDS_OAUTH_SETUP.md` §3 |
| 8 | WebMotors: INT-5b (password grant + CRM integrador) — ver §2 |
| 9 | Teste E2E manual: conectar → publicar veículo (dry-run ou API real) |

---

## 5. Resumo para o lojista (UX)

| Portal | O que o gestor faz | O que a AutoPainel faz nos bastidores |
| --- | --- | --- |
| OLX | Clica Conectar → login OLX na janela | Credenciais app AutoPainel + OAuth |
| iCarros | Informar login e senha iCarros no painel | App iCarros + password grant por loja |
| WebMotors | Informar usuário integrador CRM Cockpit | App Sensedia + password grant por loja |

Nenhum portal exige que o lojista copie chaves técnicas — excepto WebMotors no futuro (login integrador CRM, não `client_secret`).

---

## 6. Troubleshooting

| Sintoma | Causa provável | Ação |
| --- | --- | --- |
| Popup fecha, UI não atualiza | `noopener` (corrigido) ou postMessage bloqueado | Atualizar código; fechar popup manualmente — refresh consulta status |
| «Conexão em configuração» | Sem credenciais platform/env | Preencher OLX_OAUTH_* ou platform table |
| Edge 500 no callback | Secret crypto diferente painel vs Edge | Mesmo `CLASSIFIEDS_TOKENS_CRYPTO_SECRET` em ambos |
| OLX invalid redirect | URI não cadastrada na OLX | Copiar exata do §1.3 |
| Token OK mas publish falha | Plano OLX sem API / dry-run | `CLASSIFIEDS_SYNC_DRY_RUN=false` + plano Empresa |

Ver também: `INTEGRATIONS_DEPLOY.md`, `CLASSIFIEDS_INTEGRATORS_BLUEPRINT.md`.
