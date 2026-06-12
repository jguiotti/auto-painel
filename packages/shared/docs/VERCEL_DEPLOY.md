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

### Build com middleware (`--webpack`)

Apps com `middleware.ts` (`admin-master`, `dealership-panel`, `customer-site`) usam `next build --webpack` no `package.json`. O build default com **Turbopack** na Vercel pode falhar com:

`ENOENT ... middleware.js.nft.json`

(bug conhecido Next.js 16 + Turbopack + file tracing). O admin pode passar por cache; o painel falhou de forma consistente até forçar webpack.

---

## 3. DNS no Registro.br (modo avançado)

O **Registro.br não aceita** `@`, `*` nem `*.loja` no campo **Nome** — isto é limitação da plataforma, não erro seu. Referência confirmada: [tutorial Registro.br](https://viniciuspaes.com/website/tutorial-apontar-dns-dominio-para-servidor-registrobr-google-domains/) (*«o Registro.BR não permite» wildcard*).

### 3.1 Padrão que funciona (igual ao teu **odona.com.br** + Vercel)

No odona, cada hostname é um registo **explícito** com **FQDN completo** no campo Nome:

| Tipo | Nome (como aparece no Registro.br) | Dados |
| --- | --- | --- |
| A | `odona.com.br` | `76.76.21.21` |
| CNAME | `backoffice.odona.com.br` | `a8fd7769b7e042e5.vercel-dns-017.com.` |
| CNAME | `escola.odona.com.br` | `b1634886ed7701a6.vercel-dns-017.com.` |

Regras:

1. **Apex (site principal):** Tipo **A**, Nome = **`autopainel.com.br`** (domínio completo) ou **campo Nome vazio** — **nunca** `@` (dá *«Nome do record inválido - @»*).
2. **Subdomínios:** Tipo **CNAME**, Nome = **FQDN completo** (`www.autopainel.com.br`, `admin.autopainel.com.br`, …).
3. **Destino CNAME:** copiar **exactamente** o valor que a Vercel mostra ao adicionar cada domínio (ex.: `xxxx.vercel-dns-017.com.`). Pode ser diferente de `cname.vercel-dns.com` genérico.
4. **Sem wildcard:** cada loja nova precisa de **dois** CNAME explícitos (vitrine + painel) **ou** usar Cloudflare/Vercel NS (§3.3).

### 3.2 AutoPainel — registos mínimos para começar (sem wildcard)

Adicionar domínios **primeiro na Vercel** (Settings → Domains); depois replicar no Registro.br o target exacto.

| App Vercel | Adicionar na Vercel | Registro.br |
| --- | --- | --- |
| marketing | `autopainel.com.br` | **A** · Nome `autopainel.com.br` · `76.76.21.21` |
| marketing | `www.autopainel.com.br` | **CNAME** · Nome `www.autopainel.com.br` · target Vercel |
| admin | `admin.autopainel.com.br` | **CNAME** · Nome `admin.autopainel.com.br` · target Vercel |
| customer | `guiotti.autopainel.com.br` (demo) | **CNAME** · Nome `guiotti.autopainel.com.br` · target Vercel |
| panel | `guiotti.loja.autopainel.com.br` (demo) | **CNAME** · Nome `guiotti.loja.autopainel.com.br` · target Vercel |

**Demo Guiotti:** suficiente para validar produção antes de escalar.

**Nova concessionária:** repetir linhas customer + panel com `{slug}.autopainel.com.br` e `{slug}.loja.autopainel.com.br` (processo manual ou automatizar via API Cloudflare no onboarding — backlog DevOps).

### 3.3 Multitenant ilimitado — wildcards (recomendado para produção)

Como o Registro.br **não suporta** `*.autopainel.com.br`, escolha **uma**:

| Opção | O quê fazer | Wildcard |
| --- | --- | --- |
| **A — Cloudflare (recomendado)** | Registro.br → alterar **servidores DNS** para os NS da Cloudflare; zona DNS na Cloudflare com A + CNAME wildcard | Sim (`*`, `*.loja`) |
| **B — Vercel DNS** | Se o domínio estiver na Vercel Team com DNS gerido, apontar NS do Registro.br para a Vercel | Sim (conforme plano) |
| **C — Só Registro.br** | CNAME **por slug** (como odona por subdomínio) | Não — manual por loja |

**Cloudflare (resumo):**

1. Criar zona `autopainel.com.br` na Cloudflare (plano Free).
2. Registro.br → DNS → trocar servidores para os NS indicados pela Cloudflare.
3. Na Cloudflare, importar/copiar: A apex → `76.76.21.21`, CNAME `www`, `admin`, CNAME `*` → target Vercel do project customer, CNAME `*.loja` → target Vercel do project panel.

### 3.4 Erros comuns no Registro.br

| Sintoma | Causa | Solução |
| --- | --- | --- |
| **Nome do record inválido - @** | `@` não é aceite no modo avançado | Nome vazio **ou** `autopainel.com.br` |
| **Erro ao salvar** | Entrada duplicada (`loja`, `admin`, …) | Cancelar «Nova entrada»; editar linha existente |
| Wildcard rejeitado | Registro.br não suporta `*` | §3.3 Cloudflare **ou** CNAME por slug (§3.2) |
| CNAME genérico não valida | Target errado | Usar target **exacto** da Vercel (como odona `….vercel-dns-017.com.`) |

**Ordem sugerida:** (1) marketing + admin com FQDN, (2) HTTPS OK, (3) Guiotti demo, (4) Cloudflare se quiser slugs automáticos.

Propagação DNS: até 48 h; normalmente minutos.

---

## 4. Variáveis de ambiente (Production)

**Sintoma:** build OK, mas página branca / console `Server Components render` / digest no HTML → quase sempre **env vars ausentes** no projecto Vercel. O admin chama Supabase no servidor já em `/` e `/login`.

Copiar valores do `.env.local` da raiz (Supabase **remoto**, nunca chaves locais `127.0.0.1`).

### Onde configurar na Vercel

Projecto → **Settings** → **Environment Variables** → marcar **Production** (e **Preview**) → **Save** → **Redeploy** obrigatório.

Chaves no Dashboard Supabase: [Project Settings → API](https://supabase.com/dashboard/project/wcgevmvystdhqpzwuyig/settings/api) (`URL`, `anon`, `service_role`).

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

### GTM (todos os apps)

```
NEXT_PUBLIC_GTM_ID=GTM-MV99ZXW9
```

Adicionar em **Production** (e Preview, se desejar) nos **4** projectos Vercel. Redeploy obrigatório. Guia completo: `packages/shared/docs/GTM.md`.

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
