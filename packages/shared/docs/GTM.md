# Google Tag Manager (GTM)

Instalação centralizada para os **4 apps Next.js** do monorepo. Um único container GTM pode servir marketing, admin, painel e vitrine; novas lojas (subdomínios) entram automaticamente no `dataLayer` sem alterar código.

## Variáveis de ambiente

| Variável | Onde | Descrição |
| --- | --- | --- |
| `NEXT_PUBLIC_GTM_ID` | Raiz `.env.local` + **cada** projecto Vercel | Container default (ex.: `GTM-MV99ZXW9`). Se vazio, GTM não carrega. |
| `NEXT_PUBLIC_GTM_ID_MARKETING` | Opcional | Override só no marketing-site |
| `NEXT_PUBLIC_GTM_ID_ADMIN` | Opcional | Override só no admin-master |
| `NEXT_PUBLIC_GTM_ID_DEALERSHIP_PANEL` | Opcional | Override só no dealership-panel |
| `NEXT_PUBLIC_GTM_ID_CUSTOMER_STOREFRONT` | Opcional | Override só no customer-site |

Após definir na Vercel: **Save** → **Redeploy** em Production (e Preview, se quiser tags em previews).

Local: `npm run sync:env` copia a raiz `.env.local` para cada app.

## Código (fonte de verdade)

| Peça | Path |
| --- | --- |
| Snippet head/body | `packages/shared/src/components/analytics/google-tag-manager.tsx` |
| Wrapper por app (server) | `packages/shared/src/components/analytics/autopainel-google-tag-manager.tsx` |
| Resolução container + contexto | `packages/shared/src/lib/analytics/resolve-autopainel-gtm-runtime.ts` |
| Slug a partir do host | `packages/shared/src/lib/analytics/extract-dealership-slug-from-host.ts` |

Cada `apps/*/src/app/layout.tsx` inclui:

- `<AutopainelGoogleTagManagerHead appSurface="…" />` dentro de `<head>`
- `<AutopainelGoogleTagManagerBody appSurface="…" />` logo após `<body>`

## dataLayer (multitenant)

Antes de `gtm.js`, o snippet envia:

| Campo | Exemplo | Uso no GTM |
| --- | --- | --- |
| `ap_app_surface` | `customer_storefront` | Filtrar marketing vs admin vs painel vs vitrine |
| `ap_page_hostname` | `guiotti.autopainel.com.br` | Hostname completo |
| `ap_dealership_slug` | `guiotti` | Segmentar por loja (automático em `{slug}.*`) |
| `ap_dealership_id` | UUID | Quando o cookie `ap-dealership-id` já existe |

Valores de `ap_app_surface`:

- `marketing` — `autopainel.com.br`
- `admin` — `admin.autopainel.com.br`
- `dealership_panel` — `{slug}.loja.autopainel.com.br`
- `customer_storefront` — `{slug}.autopainel.com.br`

**Novas lojas:** basta criar o slug na base e o CNAME DNS; o GTM recebe `ap_dealership_slug` no próximo pageview — sem deploy extra.

## Configurar GA4 / Hotjar no GTM

1. **Google Analytics 4:** Tag GA4 Configuration → trigger «All Pages» + condição `ap_app_surface` equals `customer_storefront` (ou criar tags separadas por superfície).
2. **Hotjar:** tag Hotjar → mesmo padrão; use `Page Hostname` ou variável DL `ap_page_hostname` para relatórios por loja.
3. **Variáveis DL:** em GTM → Variables → New → Data Layer Variable → name `ap_dealership_slug`, etc.

## Checklist produção

```
[ ] NEXT_PUBLIC_GTM_ID em los 4 projectos Vercel (Production)
[ ] Redeploy após gravar env
[ ] GTM Preview: abrir guiotti.autopainel.com.br e confirmar dataLayer
[ ] GTM Preview: abrir admin.autopainel.com.br → ap_app_surface = admin
[ ] Publicar container GTM
```

## Privacidade / LGPD

Tags de marketing (GA, Hotjar) devem respeitar consentimento quando aplicável. O snippet GTM carrega sempre que `NEXT_PUBLIC_GTM_ID` está definido; use **Consent Mode** ou triggers condicionados no GTM conforme política de privacidade do produto.

**Eventos de produto:** ver [`GTM_EVENTS.md`](./GTM_EVENTS.md) — contrato `ap_custom_event` + catálogo por superfície.

**Passo a passo operacional (GTM + GA4):** [`GTM_GA4_SETUP.md`](./GTM_GA4_SETUP.md).
