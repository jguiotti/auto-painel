<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AutoPainel monorepo

- **Onboarding:** [`README.md`](README.md) — setup, apps, portas, Supabase e scripts npm.
- **Cursor rules**: `rules/*.mdc` (`.cursor/rules` is a symlink to `rules/`). Read applicable rules when touching UI, Supabase, or shared code.
- **Locale copy**: user-visible strings and Portuguese squad/operator docs use **Brazilian Portuguese (pt-BR)** — see `rules/naming-and-language.mdc`. For the **Cursor UI** in pt-BR, install the **Portuguese (Brazil) Language Pack** and run **Configure Display Language** → `pt-br` (see `.vscode/extensions.json` in this repo).
- **Internal docs (mandatory with code changes):** `rules/internal-docs-living.mdc` — keep `apps/admin-master/content/internal-docs/*.md` (and `packages/shared/docs/` when shared contracts change) aligned with what ships.
- **New features**: follow the mandatory squad workflow in `rules/squad-agent-workflow.mdc` (PM → UX → architect/backend → frontend → QA). At end of substantial work, apply `rules/squad-delivery-gates.mdc` (checkpoint + ask user next squad step).
- **Design system & shadcn**: `packages/shared` only; see `packages/shared/docs/`.
- **Dynamic pricing plans & modules (PRD + DB blueprint):** `packages/shared/docs/PRD_DYNAMIC_PRICING_PLANS_AND_MODULES.md`.
- **Supabase**: keep migrations in `supabase/migrations/`; deploy remoto automatizado: `packages/shared/docs/SUPABASE_DEPLOY.md` — `npm run supabase:deploy` + GitHub Actions em push `main`. Local: `packages/shared/docs/SUPABASE_LOCAL.md` — `npm run supabase:start`. Keep-alive: `packages/shared/docs/SUPABASE_HEALTH_PING.md`. Integrações Meta/classificados: `packages/shared/docs/INTEGRATIONS_DEPLOY.md`. Blueprint OLX/WebMotors/iCarros: `packages/shared/docs/CLASSIFIEDS_INTEGRATORS_BLUEPRINT.md`.
- **E2E**: Playwright na raiz — `npm run test:e2e` (servidores dev ligados); ver `e2e/README.md`.
