# AutoPainel — shared technical docs

Cross-cutting documentation lives here to avoid duplicating markdown across apps.

| Doc | Purpose |
|-----|---------|
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Tailwind v4, tokens, `@config`, per-app overrides |
| [SHADCN.md](./SHADCN.md) | Adding shadcn components only in `packages/shared` |
| [SUPABASE_TYPES.md](./SUPABASE_TYPES.md) | TypeScript types aligned with DB / RPCs |
| [SECURITY_SECRETS.md](./SECURITY_SECRETS.md) | Env local, verificação git, purge de histórico |
| [META_INTEGRATION_SIMPLIFIED.md](./META_INTEGRATION_SIMPLIFIED.md) | Connect Meta simplificado (app plataforma) + fases worker |
| [TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md](./TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md) | Subdomínios por loja, dev local `*.localhost`, OAuth OLX/WebMotors/Meta por concessionária, Vercel |

Project rules for agents/IDE: **`rules/`** at repo root (symlinked from `.cursor/rules`).
