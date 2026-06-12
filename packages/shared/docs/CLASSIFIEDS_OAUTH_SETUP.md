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
> - URL de redirecionamento: `https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback?provider=olx`
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

Registrar **exatamente** esta URL na OLX (produção):

```text
https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback?provider=olx
```

Local (Supabase Docker + Edge):

```text
http://127.0.0.1:54321/functions/v1/classifieds-oauth-callback?provider=olx
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

### 1.5 Teste

1. Loja enterprise com módulo `olx_sync` (ex.: Guiotti)
2. `/painel/integracoes` → Conectar OLX → login **real** OLX
3. Badge **Conectado**; tokens em `dealership_classifieds_credentials` (cifrados)

---

## 2. WebMotors — modelo diferente da OLX (importante)

Documentação oficial: [Manual Integração Revendedor — WebMotors](https://integracao.webmotors.com.br/manualintegracao/index.html)

A WebMotors **não** usa o mesmo fluxo de browser OAuth (authorization code + popup) que a OLX:

| Aspecto | OLX | WebMotors |
| --- | --- | --- |
| Fluxo | Authorization code + popup | **Password grant** (Sensedia) |
| Quem cria credenciais | AutoPainel (integrador) | App no [portal Sensedia WebMotors](https://portal-webmotors.sensedia.com/api-portal/documentacao/autenticacao) |
| Credencial da loja | Login OLX do lojista (popup) | **Usuário Integrador de API** criado pelo lojista no **CRM Cockpit** (um por loja) |
| Token URL (prod) | `https://auth.olx.com.br/oauth/token` | `https://api-webmotors.sensedia.com/oauth/v1/access-token` |
| Token URL (homolog) | — | `https://hlg-webmotors.sensedia.com/oauth/v1/access-token` |

**Implicação para o lojista:** o botão «Conectar» com popup **não funciona** com a API real da WebMotors até implementarmos **INT-5b** (formulário no painel: usuário + senha do integrador CRM, guardados cifrados por concessionária).

**Enquanto isso:**

- **Dev:** `CLASSIFIEDS_OAUTH_DEV_STUB=true` simula conexão WM no popup
- **Prod WM:** card visível se o plano incluir `webmotors_sync`, mas estado «Em homologação» até INT-5b

### 2.1 Passos DevOps / homologação WebMotors

1. Registar aplicação no portal Sensedia WebMotors Developers
2. Solicitar APIs de estoque/canais (homologação)
3. Obter `client_id` e `client_secret` da **aplicação AutoPainel** (não confundir com usuário integrador da loja)
4. Guardar em Edge secrets / `platform_classifieds_oauth_providers` (quando o fluxo password estiver implementado)
5. Documentar para cada loja: criar **Integrador de API** no CRM Cockpit WebMotors

**Backlog produto:** UI «Conectar WebMotors» → pedir login/senha do integrador CRM (nunca expor `client_secret` da app ao lojista).

---

## 3. iCarros — OAuth authorization code (semelhante à OLX)

Documentação: [iCarros OAuth API](https://www.icarros.com.br/apidocs/apiOauth.html#pp-credenciais)

### 3.1 Como funciona

1. **AutoPainel** obtém `client_id` e `client_secret` junto à **central de atendimento iCarros** (não é self-service público).
2. Registar **redirect URI** no iCarros (mesmo padrão Supabase Edge):
   ```text
   https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback?provider=icarros
   ```
3. O **lojista** clica **Conectar** → popup → login iCarros → consentimento → callback troca `code` por tokens (igual OLX).

A doc iCarros também descreve **Resource Owner Password** (`grant_type=password`) — **inadequado** para SaaS multitenant (lojista não deve dar senha iCarros à plataforma). Usar **authorization code + popup**.

### 3.2 URLs fixas (Keycloak / OpenID Connect)

| Campo | Valor |
| --- | --- |
| Authorization | `https://accounts.icarros.com/auth/realms/icarros/protocol/openid-connect/auth` |
| Token | `https://accounts.icarros.com/auth/realms/icarros/protocol/openid-connect/token` |
| Refresh | Mesmo endpoint token com `grant_type=refresh_token` |
| API (exemplo) | `https://paginasegura.icarros.com.br/rest/...` com header `Authorization: Bearer` |

### 3.3 Variáveis `.env.local` / Vercel / Edge (após credenciais iCarros)

```env
ICARROS_OAUTH_AUTHORIZATION_URL=https://accounts.icarros.com/auth/realms/icarros/protocol/openid-connect/auth
ICARROS_OAUTH_TOKEN_URL=https://accounts.icarros.com/auth/realms/icarros/protocol/openid-connect/token
ICARROS_OAUTH_CLIENT_ID=<da central iCarros>
ICARROS_OAUTH_CLIENT_SECRET=<da central iCarros>
ICARROS_OAUTH_SCOPE=openid
ICARROS_OAUTH_REDIRECT_URI=https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback?provider=icarros
ICARROS_LISTINGS_API_URL=<endpoint de anúncios após homologação>
```

Depois (mesmo fluxo OLX):

```bash
npm run classifieds:oauth:platform:configure   # incluir provider icarros + is_enabled=true
npm run classifieds:oauth:secrets:configure
```

SQL: `update public.platform_classifieds_oauth_providers set is_enabled = true where provider = 'icarros';`

### 3.4 Modelo de pedido à central iCarros

Assunto: `Homologação integrador AutoPainel — OAuth API estoque`

> Solicitamos credenciais OAuth 2.0 (`client_id`, `client_secret`) para a aplicação **AutoPainel** (plataforma SaaS para concessionárias).
>
> - Website: https://autopainel.com.br  
> - Redirect URI: `https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback?provider=icarros`  
> - Fluxo: authorization code (login do lojista + consentimento)  
> - Escopo: publicação/gestão de estoque por loja conectada

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
| iCarros | Idem (quando homologado) | Pedir `client_id`/`secret` à central iCarros |
| WebMotors | *(Em breve)* Informar usuário integrador CRM | App Sensedia + password grant por loja |

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
