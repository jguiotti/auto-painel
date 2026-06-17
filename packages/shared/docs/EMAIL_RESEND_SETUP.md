# E-mail transacional — Resend + Supabase Auth

Configuração para **Fase 1** da régua de e-mail (`EMAIL_COMMUNICATION_REGUA.md`).

## 1. Resend (já vinculado na Cloudflare)

1. Domínio `autopainel.com.br` verificado no [Resend](https://resend.com/domains).
2. DNS (SPF/DKIM) na Cloudflare — concluído por você.

## 2. Supabase hosted (produção) — SMTP

Dashboard → **Project** `wcgevmvystdhqpzwuyig` → **Authentication** → **SMTP Settings**:

| Campo | Valor |
| --- | --- |
| Enable custom SMTP | ✅ |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | API key Resend (`re_...`) |
| Sender email | `noreply@autopainel.com.br` |
| Sender name | `AutoPainel` |

## 3. Templates de e-mail (Dashboard)

**Authentication** → **Email Templates** — cole o HTML de:

| Template | Arquivo git | Assunto sugerido |
| --- | --- | --- |
| Invite | `supabase/templates/invite.html` | Bem-vindo(a) à AutoPainel — defina sua senha |
| Reset password | `supabase/templates/recovery.html` | Redefinir senha — AutoPainel |

Local (`supabase start`): templates já referenciados em `supabase/config.toml`.

## 4. Redirect URLs (obrigatório)

**Authentication** → **URL Configuration** → **Redirect URLs** — adicionar:

```
https://admin.autopainel.com.br/auth/confirm**
https://admin.autopainel.com.br/definir-senha
https://admin.autopainel.com.br/recuperar-senha
https://*.loja.autopainel.com.br/auth/confirm**
https://*.loja.autopainel.com.br/definir-senha
https://*.loja.autopainel.com.br/recuperar-senha
```

**Site URL** (opcional): `https://admin.autopainel.com.br`

## 5. Variáveis Vercel / `.env.local`

```env
RESEND_API_KEY=re_...                    # local supabase + referência
NEXT_PUBLIC_ADMIN_AUTH_REDIRECT_ORIGIN=https://admin.autopainel.com.br
NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=autopainel.com.br
NEXT_PUBLIC_DEALERSHIP_PANEL_URL_TEMPLATE=https://{slug}.loja.autopainel.com.br
NEXT_PUBLIC_CUSTOMER_SITE_URL_TEMPLATE=https://{slug}.autopainel.com.br
```

Admin-master e dealership-panel precisam do **panel URL template** para links de convite por slug.

Depois: `npm run sync:env` + redeploy Vercel.

## 6. Testar

1. Admin → Concessionária → Equipe → convidar e-mail de teste.
2. Verificar inbox + link abre `{slug}.loja.autopainel.com.br/definir-senha`.
3. Admin → `/recuperar-senha` → e-mail com marca AutoPainel.

## 7. Cloudflare wildcards (novas lojas)

DNS propagado (`dig NS` → `*.ns.cloudflare.com`). Criar wildcards:

```bash
npm run dealership:hosts:provision -- --wildcards-only --cloudflare
```

Nova loja depois:

```bash
npm run dealership:hosts:provision -- minha-loja
```

(Só Vercel — DNS wildcard já cobre.)
