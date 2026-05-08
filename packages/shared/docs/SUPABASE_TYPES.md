# TypeScript types and Supabase

## Where to declare

- Types shared across apps or derived from DB contracts (RPCs, insert payloads, stable enums): **`packages/shared/src/types/`**.
- Re-export new modules from **`src/types/index.ts`**.

## When to update

Whenever you:

- create or change an SQL **function** exposed via RPC (`supabase.rpc(...)`),
- change columns heavily used in the UI,
- add or change tables consumed from TypeScript (e.g. `public.platform_internal_documents` in admin-master),
- or introduce a new JSON “contract”,

…add or update interfaces under `packages/shared/src/types` (e.g. `supabase-rpc.ts`, `dealership-storefront.ts`, `dealership-config.ts`, `pricing-catalog.ts`).

### `effective_feature_keys_for_active_dealership`

Merged module keys for a dealership: uses **`pricing_plan_modules`** when **`dealerships.pricing_plan_id`** is set; otherwise legacy **`enabled_features`** (empty ⇒ all active rows in **`saas_modules`**). Called from **`customer-site`** / **`dealership-panel`** next to **`get_dealership_public_by_id`**. Args interface: **`EffectiveFeatureKeysForDealershipArgs`** in `supabase-rpc.ts`.

### `disconnect_dealership_meta_connection`

JWT autenticado no tenant: remove linhas **`dealership_meta_credentials`** e faz reset de metadados em **`dealership_meta_connections`**. Chamada típica: **`supabase.rpc("disconnect_dealership_meta_connection")`** sem objeto de argumentos.

### `dealerships.layout_id`

Public storefront reads `layout_id` (1–3) via `get_dealership_public_by_id` (returns full row). Mirror it in app-specific `DealershipPublicRecord` types.

### Optional `theme_config.font_pair_id`

Closed list `default | serif_editorial | sans_geometric` — consumed by `resolveDealershipFontStacks` in `@autopainel/shared/lib/theme/branding`.

## Generated types (optional)

You may complement with `supabase gen types` and merge with hand-written types; consume shared types from **`@autopainel/shared/types`** in all apps.

## Applying database changes

Migrations live in **`supabase/migrations/`**. The team convention is to provide SQL to run in the Supabase Dashboard unless a maintainer explicitly runs the CLI; see `rules/supabase-workflow.mdc`.
