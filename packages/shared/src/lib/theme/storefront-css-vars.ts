import type { CSSProperties } from "react";

import {
  resolveDealershipBranding,
  resolveDealershipFontStacks,
  type ResolvedDealerTheme,
} from "./branding";
import { pickReadableForegroundColor } from "./color-contrast";

export interface StorefrontThemeSources {
  theme_settings?: unknown;
  theme_config?: unknown;
}

/**
 * Canonical CSS custom properties for customer-site templates.
 * Aliases (--primary-color, --secondary-color) keep legacy template hooks stable.
 */
export function buildStorefrontCssVariables(
  sources: StorefrontThemeSources,
): CSSProperties {
  const theme = resolveDealershipBranding(sources);
  const fonts = resolveDealershipFontStacks(sources.theme_config);
  const primaryFg = pickReadableForegroundColor(theme.primary);
  const accentFg = pickReadableForegroundColor(theme.accent);

  return {
    "--dealer-primary": theme.primary,
    "--dealer-accent": theme.accent,
    "--dealer-bg": theme.background,
    "--dealer-fg": theme.foreground,
    "--dealer-surface": theme.surface,
    "--dealer-primary-fg": primaryFg,
    "--dealer-accent-fg": accentFg,
    "--dealer-font-heading": fonts.heading,
    "--dealer-font-body": fonts.body,
    "--primary-color": theme.primary,
    "--secondary-color": theme.accent,
    "--primary-foreground": primaryFg,
    "--secondary-foreground": accentFg,
    "--storefront-bg": theme.background,
    "--storefront-fg": theme.foreground,
    "--storefront-surface": theme.surface,
    "--storefront-font-heading": fonts.heading,
    "--storefront-font-body": fonts.body,
    "--background": theme.background,
    "--foreground": theme.foreground,
  } as CSSProperties;
}

export function resolveStorefrontTheme(
  sources: StorefrontThemeSources,
): ResolvedDealerTheme {
  return resolveDealershipBranding(sources);
}
