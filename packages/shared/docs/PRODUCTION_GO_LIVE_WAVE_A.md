# Onda A — Go-live saudável (checklist operacional)

Lista executável antes de declarar o **demo Guiotti** e o marketing **prontos para uso diário**. Marque cada item no Dashboard / Vercel / Registro.br.

Projeto Supabase: **`wcgevmvystdhqpzwuyig`**

---

## 1. Smoke HTTP (produção)

| URL | Esperado |
| --- | --- |
| https://autopainel.com.br | 200 — marketing |
| https://admin.autopainel.com.br/login | 200 — admin |
| https://guiotti.loja.autopainel.com.br/painel | 200 ou redirect `/login` |
| https://guiotti.autopainel.com.br | 200 — vitrine Guiotti |
| https://guiotti.loja.autopainel.com.br/painel/integracoes | 200 — hub integrações |

Cookie esperado nas lojas: `ap-dealership-id` = UUID da concessionária.

---

## 2. Supabase Auth — URL Configuration

Dashboard → [Authentication → URL Configuration](https://supabase.com/dashboard/project/wcgevmvystdhqpzwuyig/auth/url-configuration)

| Campo | Valor |
| --- | --- |
| **Site URL** | `https://autopainel.com.br` |

**Redirect URLs** — adicionar **uma linha de cada vez** (Save no final):

```
https://admin.autopainel.com.br/**
https://*.loja.autopainel.com.br/**
https://*.autopainel.com.br/**
https://guiotti.loja.autopainel.com.br/**
https://guiotti.autopainel.com.br/**
http://localhost:3001/**
http://localhost:3002/**
http://localhost:3003/**
http://*.localhost:3002/**
https://*--odona-project.vercel.app/**
```

Se a UI não aceitar wildcard `*.loja`, liste cada slug activo (ex.: `https://guiotti.loja.autopainel.com.br/**`).

**Teste após Save:**

1. Admin: login em `https://admin.autopainel.com.br/login`
2. Painel: recuperar senha / convite colaborador → link deve abrir em `https://{slug}.loja.autopainel.com.br/auth/confirm`

---

## 3. DNS — `www.autopainel.com.br`

| Passo | Acção |
| --- | --- |
| Vercel | Project `auto-painel-site` → Settings → Domains → Add `www.autopainel.com.br` |
| Registro.br | CNAME · Nome `www.autopainel.com.br` · target **exacto** que a Vercel mostrar |
| Redirect | Preferir redirect `www` → apex na Vercel (ou CNAME + redirect) |

Sintoma actual: `curl https://www.autopainel.com.br` falha SSL/DNS — apex `autopainel.com.br` OK.

---

## 4. Variáveis Vercel (mínimo por projecto)

Ver `VERCEL_DEPLOY.md` §4. Confirmar **Production** + **Redeploy** após alterar.

| Projecto | Crítico |
| --- | --- |
| Todos | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GTM_ID` |
| admin-master | `SUPABASE_SERVICE_ROLE_KEY`, templates URL painel/vitrine |
| dealership-panel | `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=loja.autopainel.com.br`, OLX `*`, `CLASSIFIEDS_*` |
| customer-site | `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=autopainel.com.br` |

---

## 5. OLX — teste end-to-end

1. Loja Guiotti com módulo `olx_sync` no plano
2. `/painel/integracoes` → **Conectar OLX** → login real OLX
3. Badge **Conectado**
4. (Opcional) cadastrar veículo com foto → fila publish com `CLASSIFIEDS_SYNC_DRY_RUN=false`

Redirect URI registada na OLX:

```text
https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback?provider=olx
```

---

## 6. WebMotors — expectativa do lojista

| Portal | Fluxo no painel | Estado |
| --- | --- | --- |
| **OLX** | Popup login (OAuth) | Homologável — credenciais AutoPainel |
| **WebMotors** | **Não** é popup — usuário integrador CRM | Homologável — ver `CLASSIFIEDS_OAUTH_SETUP.md` §2 |

O lojista **não** configura chaves — só clica **Conectar** quando a plataforma publicar credenciais.

---

## 7. GTM

1. Confirmar `NEXT_PUBLIC_GTM_ID=GTM-MV99ZXW9` nos 4 projectos
2. [GTM Preview](https://tagmanager.google.com/) em `guiotti.autopainel.com.br`
3. Validar `dataLayer`: `ap_app_surface`, `ap_dealership_slug`

Guia: `GTM.md`

---

## 8. Keep-alive Supabase

```bash
# .env.local com SUPABASE_ANON_KEY **remota** (não Docker 127.0.0.1)
npm run supabase:ping:remote
```

GitHub Action: `.github/workflows/supabase-health-ping.yml`

---

## 9. Assinatura go-live

```
[ ] Smoke §1 OK
[ ] Auth Redirect URLs §2 OK + login testado
[ ] www §3 OK (ou documentado como pendente)
[ ] Env vars §4 auditadas
[ ] OLX E2E §5 OK (ou dry-run documentado)
[ ] Copy integradores §6 comunicada à equipa
[ ] GTM Preview §7 OK
[ ] Ping remoto §8 OK
```

Próxima onda: **Cloudflare wildcard** (escalar slugs) + homologação WebMotors em produção.
