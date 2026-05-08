# Design system (Tailwind + shadcn)

## Source of truth

1. **`packages/shared/tailwind.config.js`** — referenced from app CSS via `@config` and from shadcn `components.json`.
2. **`packages/shared/src/styles/globals.css`** — default tokens (`@layer base`, `@theme inline`) aligned with shadcn (New York, CSS variables).

## Pattern per app (`src/app/globals.css`)

```css
@import "tailwindcss";
@config "../../../../packages/shared/tailwind.config.js";
@import "@autopainel/shared/globals.css";

@source "../../../../packages/shared/src/**/*.tsx";
@source "../**/*.{ts,tsx}";

/* Optional: :root and @theme inline only for app-specific overrides */
```

Adjust the `@config` path to match the depth of your entry CSS file.

## Product-specific themes

- **Admin / default**: after the shared import, override fonts (e.g. Geist) in `@theme inline`.
- **Whitelabel storefront (`dealer-*`)**: keep `--dealer-*` in the app and map `--color-primary`, `--color-card`, etc.
- **Marketing**: may keep a distinct palette by overriding `@theme` after the shared import.

## Dark mode

The shared package ships light-first defaults. Apps may extend with `@media (prefers-color-scheme: dark)` on `:root` or extra tokens (as the dealership panel already does).
