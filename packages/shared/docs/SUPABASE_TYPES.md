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

### `vehicle_sale_receipts`

Tabela **`public.vehicle_sale_receipts`**: um registro **editável** por veículo vendido (`vehicle_id` unique). Campos comprador, `payment_lines` JSONB, snapshot do veículo (marca, modelo, tipo, placa, RENAVAM, etc.). **RLS:** tenant via `profiles.dealership_id`. Módulo **`recibo_compra`**. Tipos: **`packages/shared/src/types/sale-receipt.ts`**. Validador CPF/CNPJ: **`@autopainel/shared/lib/validators/buyer-document`**. RPCs: **`upsert_vehicle_sale_receipt`**, **`get_vehicle_sale_receipt`** — interfaces em `supabase-rpc.ts`. Migração: **`20260611143000_sale_receipt_module.sql`**; catálogo consolidado em **`20260611210000_remove_sale_receipt_duplicate_module.sql`**.

### `dealership_classifieds_oauth_apps`

Tabela **`public.dealership_classifieds_oauth_apps`**: `oauth_client_id` + **`oauth_client_secret_encrypted`** por `dealership_id` e provider (`olx` \| `webmotors`). **RLS:** JWT `anon`/`authenticated` sem acesso; escrita/leitura apenas **service role** / Edge (igual a **`dealership_classifieds_credentials`**). Tipos: **`DealershipClassifiedsOauthAppRow`**, **`DealershipClassifiedsOauthAppUpsertInput`**, **`DealershipClassifiedsOauthAppPublic`** em `packages/shared/src/types/classifieds-oauth-app.ts`. Migração: **`supabase/migrations/20260508220000_dealership_classifieds_oauth_apps.sql`**.

### `dealership_meta_oauth_apps`

Tabela **`public.dealership_meta_oauth_apps`** (1:1 `dealership_id`): **App ID** e **App Secret** cifrado para o fluxo OAuth Meta **da concessionária**. RLS: sem acesso JWT. Tipos em **`meta-oauth-app.ts`**. Migração **`supabase/migrations/20260508231000_dealership_meta_oauth_apps.sql`**. Cifra do secret com **`META_TOKENS_CRYPTO_SECRET`** (consistente com tokens em `dealership_meta_credentials`).

### `platform_sales_*` (equipe comercial)

Escopo **plataforma** (não tenant loja). Tabelas: **`platform_sales_reps`**, **`platform_sales_rep_bank_accounts`**, **`platform_sales_rep_dealership_attributions`**, **`platform_commission_ledger_entries`**, **`platform_payout_batches`**, etc. Helpers: **`current_platform_sales_rep_id()`**, **`is_platform_sales_rep()`**. RPCs: **`transfer_sales_rep_portfolio`**, **`confirm_dealership_sales_attribution`**, **`clawback_dealership_sales_commissions`**, **`approve_sales_commission_ledger_entries`**. Tipos: **`platform-sales-squad.ts`**, args em **`supabase-rpc.ts`**. Migração: **`20260620180100_platform_sales_squad.sql`**. Doc: **`PLATFORM_SALES_SQUAD_ARCHITECTURE.md`**.

## Generated types (optional)

You may complement with `supabase gen types` and merge with hand-written types; consume shared types from **`@autopainel/shared/types`** in all apps.

## Applying database changes

Migrations live in **`supabase/migrations/`**. The team convention is to provide SQL to run in the Supabase Dashboard unless a maintainer explicitly runs the CLI; see `rules/supabase-workflow.mdc`.

## Security advisor (Supabase Dashboard)

- **Leaked password protection:** in the project dashboard, open **Authentication** → **Policies** (or **Providers** / password settings, depending on dashboard version) and enable **breached password protection** (Have I Been Pwned). This is a product setting, not a migration.
- **SECURITY DEFINER RPCs** used for the public vitrine (`get_dealership_public_by_slug`, `get_public_vehicle_by_id`, `effective_feature_keys_for_active_dealership`, `resolve_dealership_id_by_host_for_dashboard`, `get_dealership_id_by_slug_for_dashboard`): they stay `SECURITY DEFINER` so `anon`/`authenticated` callers can read storefront data **without** granting broad `SELECT` on `dealerships` / `vehicles` (which would allow cross-tenant listing). Hardening migrations such as `supabase/migrations/20260508164500_security_advisor_hardening.sql` narrow what we can (storage listing removal, RLS helpers in schema `private`, explicit deny policies on credential tables, `SECURITY INVOKER` on the dealerships plan trigger where safe).
- **REST schema config:** keep **only** `public` (and defaults like `storage`) in **API → Exposed schemas**; do **not** add the `private` helper schema, or those helpers become callable RPCs again.
- **SECURITY INVOKER delegates (`20260508201500_rpc_security_invoker_wrappers.sql`):** high-traffic storefront/dashboard RPCs remain under the same `public` names, but `public.*` is `SECURITY INVOKER` and delegates to `private.*_impl` (`SECURITY DEFINER`). The Advisor then reports DEFINER on `private.*`, not on the PostgREST-exposed `public` entrypoints.
