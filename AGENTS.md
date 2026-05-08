<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AutoPainel monorepo

- **Cursor rules**: `rules/*.mdc` (`.cursor/rules` is a symlink to `rules/`). Read applicable rules when touching UI, Supabase, or shared code.
- **Internal docs (mandatory with code changes):** `rules/internal-docs-living.mdc` — keep `apps/admin-master/content/internal-docs/*.md` (and `packages/shared/docs/` when shared contracts change) aligned with what ships.
- **New features**: follow the mandatory squad workflow in `rules/squad-agent-workflow.mdc` (PM → UX → architect/backend → frontend → QA).
- **Design system & shadcn**: `packages/shared` only; see `packages/shared/docs/`.
- **Dynamic pricing plans & modules (PRD + DB blueprint):** `packages/shared/docs/PRD_DYNAMIC_PRICING_PLANS_AND_MODULES.md`.
- **Supabase**: keep migrations in `supabase/migrations/`; prefer giving the user SQL to run in the dashboard unless they explicitly request CLI push.
