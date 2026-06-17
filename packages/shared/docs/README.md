# AutoPainel — shared technical docs

Cross-cutting documentation lives here to avoid duplicating markdown across apps.

| Doc | Purpose |
|-----|---------|
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Tailwind v4, tokens, `@config`, per-app overrides |
| [SHADCN.md](./SHADCN.md) | Adding shadcn components only in `packages/shared` |
| [SUPABASE_TYPES.md](./SUPABASE_TYPES.md) | TypeScript types aligned with DB / RPCs |
| [SECURITY_SECRETS.md](./SECURITY_SECRETS.md) | Env local, verificação git, purge de histórico |
| [TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md](./TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md) | Subdomínios por loja, dev local `*.localhost`, OAuth OLX/WebMotors/Meta por concessionária, Vercel |
| [GTM.md](./GTM.md) | Google Tag Manager — instalação nos 4 apps |
| [GTM_EVENTS.md](./GTM_EVENTS.md) | Eventos unificados GA4 (`ap_event`, superfícies, lojas) |
| [DEALERSHIP_HOSTS_PROVISIONING.md](./DEALERSHIP_HOSTS_PROVISIONING.md) | Publicar slug na Vercel + DNS Registro.br/Cloudflare |
| [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) | Deploy dos 4 apps Next.js + env vars |
| [META_INTEGRATION_SIMPLIFIED.md](./META_INTEGRATION_SIMPLIFIED.md) | Connect Meta + App Review + loja demo |
| [INTEGRATIONS_DEPLOY.md](./INTEGRATIONS_DEPLOY.md) | Secrets Edge, classificados, workers |

Project rules for agents/IDE: **`rules/`** at repo root (symlinked from `.cursor/rules`).
