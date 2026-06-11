# Deploy na Vercel (AutoPainel)

Guia para publicar os **4 apps Next.js** do monorepo com DNS no **Registro.br** e Supabase **remoto** (`wcgevmvystdhqpzwuyig`).

## Mapa de domínios

| App | Projeto Vercel (sugestão) | Hostnames |
| --- | --- | --- |
| `marketing-site` | `autopainel-marketing` | `autopainel.com.br`, `www.autopainel.com.br` |
| `admin-master` | `autopainel-admin` | `admin.autopainel.com.br` |
| `dealership-panel` | `autopainel-panel` | **`{slug}.loja.autopainel.com.br`** (wildcard `*.loja.autopainel.com.br`) |
| `customer-site` | `autopainel-customer` | **`{slug}.autopainel.com.br`** (wildcard `*.autopainel.com.br`) |

**Importante — painel da loja:** o middleware resolve o tenant pelo **primeiro segmento** do host em relação à raiz configurada. Com `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=loja.autopainel.com.br`, a URL canónica do painel da loja **Guiotti** é `https://guiotti.loja.autopainel.com.br` (não `loja.autopainel.com.br` sem slug). O host `loja.autopainel.com.br` sozinho não resolve concessionária.

**Vitrine:** `https://guiotti.autopainel.com.br` com `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=autopainel.com.br` no project `customer-site`.

Cada app tem `vercel.json` com install/build via Turborepo na raiz do repo.

---

## 1. Pré-requisitos

1. Conta [Vercel](https://vercel.com) ligada ao GitHub (`jguiotti/auto-painel`).
2. Plano que suporte **wildcard DNS** (Pro ou superior) para `*.autopainel.com.br` e `*.loja.autopainel.com.br`.
3. Migrações Supabase já aplicadas no remoto (`npm run supabase:deploy`).
4. Build local OK (opcional): `npx turbo run build --filter=@autopainel/marketing-site --filter=@autopainel/dealership-panel`.

---

## 2. Criar os 4 projetos na Vercel

Repetir para cada app (Import Git Repository → mesmo repo, **Root Directory** diferente):

| Root Directory | Nome sugerido |
| --- | --- |
| `apps/marketing-site` | autopainel-marketing |
| `apps/admin-master` | autopainel-admin |
| `apps/dealership-panel` | autopainel-panel |
| `apps/customer-site` | autopainel-customer |

**Framework Preset:** Next.js (detectado).  
**Node.js:** 20.x (Settings → General).  
**Include source files outside of the Root Directory:** **Enabled** (obrigatório — senão `packages/shared` e `package-lock.json` da raiz não entram no build).

### Erro comum: `workspace:` / `npm ci` a falhar

Se o log mostrar `@autopainel/*@workspace:` ou `Unsupported URL Type "workspace:"`:

1. Confirme que **`vercel.json`** está commitado no git dentro de cada `apps/*/`.
2. **Root Directory** tem de ser `apps/<app>` — **não** a raiz do repo.
3. Em **Settings → General → Build & Development Settings**, o **Install Command** deve estar vazio (deixar o `vercel.json` mandar) ou ser exactamente:
   ```bash
   npm ci --prefix ../..
   ```
4. **Não** active «Override» com `npm install` só na pasta do app — isso quebra o monorepo npm workspaces.

O `vercel.json` em cada app já define:

```json
"installCommand": "npm ci --prefix ../..",
"buildCommand": "npm exec --prefix ../.. -- turbo run build --filter=@autopainel/<app>"
```

Production branch: `main`.

---

## 3. DNS no Registro.br

No painel do domínio **autopainel.com.br**, após adicionar cada domínio na Vercel (Settings → Domains), a Vercel mostra os registos exactos. Modelo típico:

### Site institucional (`autopainel-marketing`)

| Tipo | Nome | Valor |
| --- | --- | --- |
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

(Alternativa recomendada pela Vercel: usar só os registos que o wizard indicar após «Add Domain».)

### Admin (`autopainel-admin`)

| Tipo | Nome | Valor |
| --- | --- | --- |
| `CNAME` | `admin` | `cname.vercel-dns.com` |

### Vitrine — wildcard (`autopainel-customer`)

| Tipo | Nome | Valor |
| --- | --- | --- |
| `CNAME` | `*` | `cname.vercel-dns.com` |

Domínios **apex** reservados (`admin`, `www`, `loja`) devem estar atribuídos aos projectos correctos na Vercel; a Vercel prioriza o hostname mais específico.

### Painel loja — wildcard (`autopainel-panel`)

| Tipo | Nome | Valor |
| --- | --- | --- |
| `CNAME` | `*.loja` | `cname.vercel-dns.com` |

No Registro.br o nome do registo costuma ser `*.loja` (subdomínio wildcard sob `loja`).

**Ordem sugerida:** (1) marketing + admin, (2) validar HTTPS, (3) wildcards customer + panel.

Propagação DNS: até 48 h; normalmente minutos.

### Erros comuns no Registro.br

| Sintoma | Causa | Solução |
| --- | --- | --- |
| **Erro ao salvar alterações de DNS** | Entrada duplicada (ex.: `loja` CNAME já existe na tabela) | **Cancele** «Nova entrada»; edite a linha existente ou apague antes de recriar |
| Wildcard vitrine não resolve | Falta registo `*` | Adicionar **só uma vez**: Tipo `CNAME`, Nome `*`, Dados `cname.vercel-dns.com` |
| Painel `{slug}.loja` não resolve | Só existe `loja`, falta wildcard | Adicionar: Tipo `CNAME`, Nome `*.loja`, Dados `cname.vercel-dns.com` |
| Conflito apex | CNAME no `@` com A record | Mantenha `@` como **A** `76.76.21.21`; nunca CNAME no apex |

**Estado correcto mínimo (além do que já tens):**

| Tipo | Nome | Dados |
| --- | --- | --- |
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |
| CNAME | `admin` | `cname.vercel-dns.com` |
| CNAME | `*` | `cname.vercel-dns.com` |
| CNAME | `*.loja` | `cname.vercel-dns.com` |

O registo `loja` (sem slug) é opcional — o painel multitenant usa **`guiotti.loja.autopainel.com.br`**, não `loja.autopainel.com.br` sozinho.

---

## 4. Variáveis de ambiente (Production)

Copiar valores do `.env.local` da raiz (Supabase **remoto**, nunca chaves locais `127.0.0.1`).

### Comuns a todos os apps (browser)

```
NEXT_PUBLIC_SUPABASE_URL=https://wcgevmvystdhqpzwuyig.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key do Dashboard Supabase>
NEXT_PUBLIC_AUTOPAINEL_SITE_URL=https://autopainel.com.br
```

### `autopainel-marketing`

Sem segredos server-only obrigatórios além do Supabase público (se o site usar).

### `autopainel-admin`

```
SUPABASE_SERVICE_ROLE_KEY=<service role — só server>
NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=autopainel.com.br
NEXT_PUBLIC_DEALERSHIP_PANEL_URL_TEMPLATE=https://{slug}.loja.autopainel.com.br
NEXT_PUBLIC_CUSTOMER_SITE_URL_TEMPLATE=https://{slug}.autopainel.com.br
ADMIN_PROVISION_FUNCTION_SECRET=<igual Edge PROVISION_FUNCTION_SECRET>
```

Redirect Auth Supabase: `https://admin.autopainel.com.br/**`

### `autopainel-panel` (dealership-panel)

```
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=loja.autopainel.com.br
NEXT_PUBLIC_DEALERSHIP_AUTH_REDIRECT_ORIGIN=https://guiotti.loja.autopainel.com.br
```
(Em produção o origin efectivo vem do `Host` da request; a variável acima é fallback legado.)

**Classificados OLX (produção):**

```
CLASSIFIEDS_OAUTH_DEV_STUB=false
CLASSIFIEDS_TOKENS_CRYPTO_SECRET=<mesmo valor nas Edge secrets>
OLX_OAUTH_AUTHORIZATION_URL=https://auth.olx.com.br/oauth
OLX_OAUTH_TOKEN_URL=https://auth.olx.com.br/oauth/token
OLX_OAUTH_CLIENT_ID=
OLX_OAUTH_CLIENT_SECRET=
OLX_OAUTH_SCOPE=autoupload
OLX_OAUTH_REDIRECT_URI=https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback?provider=olx
CLASSIFIEDS_SYNC_DRY_RUN=false
```

Também executar (uma vez, contra remoto):

```bash
npm run classifieds:oauth:platform:configure   # SQL → Dashboard ou MCP
npm run classifieds:oauth:secrets:configure      # Edge secrets
```

**Integrações / workers:**

```
INTEGRATION_WORKERS_CRON_SECRET=
SOCIAL_CAROUSEL_RENDER_URL=https://guiotti.loja.autopainel.com.br/api/internal/social-carousel-render
SOCIAL_CAROUSEL_RENDER_SECRET=
```

Supabase Auth → Redirect URLs: `https://*.loja.autopainel.com.br/**` (pattern wildcard se disponível) ou listar slugs activos.

### `autopainel-customer`

```
NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=autopainel.com.br
```

Sem `SUPABASE_SERVICE_ROLE_KEY` no customer-site salvo necessidade futura.

---

## 5. Supabase Auth (obrigatório)

Dashboard → **Authentication → URL Configuration**:

| Campo | Valor |
| --- | --- |
| Site URL | `https://autopainel.com.br` |
| Redirect URLs | `https://admin.autopainel.com.br/**`, `https://*.loja.autopainel.com.br/**`, `https://*.autopainel.com.br/**` (ajustar conforme UI) |

---

## 6. CLI (opcional)

```bash
vercel login
cd apps/marketing-site && vercel link    # repetir por app
vercel env pull .env.vercel.local
```

Script auxiliar: `npm run vercel:link:all` (ver `scripts/vercel-link-all.mjs`).

---

## 7. Checklist pós-deploy

```
[ ] https://autopainel.com.br abre marketing-site
[ ] https://admin.autopainel.com.br — login super admin
[ ] https://{slug}.loja.autopainel.com.br/painel — painel loja (ex.: guiotti)
[ ] https://{slug}.autopainel.com.br — vitrine pública
[ ] /painel/integracoes → Conectar OLX redirecciona para auth.olx.com.br
[ ] Callback Edge classifieds-oauth-callback 200 após login OLX
[ ] npm run supabase:ping:remote OK
```

---

## 8. Desenvolvimento local vs produção

| Variável | Local | Produção (Vercel) |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` | `https://wcgevmvystdhqpzwuyig.supabase.co` |
| `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` | `localhost` | `autopainel.com.br` ou `loja.autopainel.com.br` (por app) |
| `CLASSIFIEDS_OAUTH_DEV_STUB` | `true` (opcional) | `false` |

Ver também: `TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md`, `CLASSIFIEDS_OAUTH_SETUP.md`, `SUPABASE_DEPLOY.md`.
