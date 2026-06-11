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
OLX_OAUTH_REDIRECT_URI=https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback?provider=olx
OLX_LISTINGS_API_URL=https://apps.olx.com.br/autoupload/import
```

Depois:

```bash
npm run sync:env
npm run classifieds:oauth:platform:configure    # gera SQL platform_classifieds_oauth_providers
npm run classifieds:oauth:platform:configure -- --apply-local   # só Supabase local
npm run classifieds:oauth:secrets:configure     # secrets Edge
supabase functions deploy classifieds-oauth-callback --project-ref wcgevmvystdhqpzwuyig
```

Aplicar o SQL gerado em `supabase/.generated-platform-classifieds-oauth.sql` no Dashboard remoto se não usar `--apply-local`.

### 1.5 Teste

1. Loja enterprise com módulo `olx_sync` (ex.: Guiotti)
2. `/painel/integracoes` → Conectar OLX → login **real** OLX
3. Badge **Conectado**; tokens em `dealership_classifieds_credentials` (cifrados)

---

## 2. WebMotors — modelo diferente (atenção)

A WebMotors **não** usa o mesmo fluxo de browser OAuth que a OLX na documentação pública atual:

- Autenticação via **POST** `https://api-webmotors.sensedia.com/oauth/v1/access-token` (homolog: `https://hlg-webmotors.sensedia.com/oauth/v1/access-token`)
- **Grant type password** + usuário **Integrador de API** criado pelo lojista no CRM Cockpit (um por loja)
- `client_id` / `client_secret` do app registrado no [portal WebMotors Developers](https://portal-webmotors.sensedia.com/api-portal/documentacao/autenticacao)

**Implicação:** o popup OAuth genérico do painel **não** funciona com a API real da WebMotors sem adaptação (formulário usuário/senha integrador por loja ou fluxo custom). Enquanto isso:

- **Dev:** `CLASSIFIEDS_OAUTH_DEV_STUB=true` simula conexão WM
- **Prod WM:** backlog **INT-5b** — implementar auth password grant + credenciais por concessionária

Contato homologação: portal Sensedia → registrar app → solicitar APIs de estoque/canais.

---

## 3. iCarros

Sem documentação OAuth pública fechada no repo. Manter dev stub ou aguardar credenciais do parceiro (**INT-3** / **INT-5**).

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
| 7 | Teste E2E manual: conectar → publicar veículo (dry-run ou API real) |

---

## 5. Troubleshooting

| Sintoma | Causa provável | Ação |
| --- | --- | --- |
| Popup fecha, UI não atualiza | `noopener` (corrigido) ou postMessage bloqueado | Atualizar código; fechar popup manualmente — refresh consulta status |
| «Conexão em configuração» | Sem credenciais platform/env | Preencher OLX_OAUTH_* ou platform table |
| Edge 500 no callback | Secret crypto diferente painel vs Edge | Mesmo `CLASSIFIEDS_TOKENS_CRYPTO_SECRET` em ambos |
| OLX invalid redirect | URI não cadastrada na OLX | Copiar exata do §1.3 |
| Token OK mas publish falha | Plano OLX sem API / dry-run | `CLASSIFIEDS_SYNC_DRY_RUN=false` + plano Empresa |

Ver também: `INTEGRATIONS_DEPLOY.md`, `CLASSIFIEDS_INTEGRATORS_BLUEPRINT.md`.
