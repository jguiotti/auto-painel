/**
 * Resolves storefront / panel CSS variables from `theme_config` (admin-master)
 * with fallback to legacy `theme_settings` (primary, accent, etc.).
 */

import type {
  DealershipFontPairId,
  StorefrontThemeMode,
} from "../../types/dealership-config";

import { buildGoogleFontsStylesheetHref } from "./google-fonts-stylesheet-url";

export { buildGoogleFontsStylesheetHref };

function asRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as Record<string, unknown>;
}

function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  if (typeof v !== "string") {
    return undefined;
  }
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function readHex(obj: Record<string, unknown>, key: string): string | undefined {
  const s = readString(obj, key);
  if (!s) {
    return undefined;
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) {
    return s;
  }
  return undefined;
}

export interface ResolvedDealerTheme {
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  surface: string;
}

const FALLBACK: ResolvedDealerTheme = {
  primary: "#18181b",
  accent: "#0d9488",
  background: "#fafafa",
  foreground: "#171717",
  surface: "#ffffff",
};

const LIGHT_MODE_DEFAULTS: Pick<
  ResolvedDealerTheme,
  "background" | "foreground" | "surface"
> = {
  background: "#fafafa",
  foreground: "#171717",
  surface: "#ffffff",
};

const DARK_MODE_DEFAULTS: Pick<
  ResolvedDealerTheme,
  "background" | "foreground" | "surface"
> = {
  background: "#0b1120",
  foreground: "#e5e7eb",
  surface: "#111827",
};

function readStorefrontThemeMode(
  ts: Record<string, unknown>,
  tc: Record<string, unknown>,
): StorefrontThemeMode {
  const themeMode = readString(tc, "storefront_theme_mode");
  if (themeMode === "dark") {
    return "dark";
  }
  if (themeMode === "light") {
    return "light";
  }
  const legacyThemeMode = readString(ts, "storefront_theme_mode");
  return legacyThemeMode === "dark" ? "dark" : "light";
}

export function resolveDealershipBranding(input: {
  theme_settings?: unknown;
  theme_config?: unknown;
}): ResolvedDealerTheme {
  const ts = asRecord(input.theme_settings);
  const tc = asRecord(input.theme_config);
  const themeMode = readStorefrontThemeMode(ts, tc);
  const modeDefaults =
    themeMode === "dark" ? DARK_MODE_DEFAULTS : LIGHT_MODE_DEFAULTS;

  const primary =
    readHex(tc, "primary_color") ??
    readHex(ts, "primary") ??
    FALLBACK.primary;
  const accent =
    readHex(tc, "secondary_color") ??
    readHex(ts, "accent") ??
    FALLBACK.accent;
  const background =
    readHex(ts, "background") ??
    readHex(tc, "background") ??
    modeDefaults.background;
  const foreground =
    readHex(ts, "foreground") ??
    readHex(tc, "foreground") ??
    modeDefaults.foreground;
  const surface =
    readHex(ts, "surface") ?? readHex(tc, "surface") ?? modeDefaults.surface;

  return { primary, accent, background, foreground, surface };
}

function quotedGoogleFontCssStack(familyName: string): string {
  const trimmed = familyName.trim();
  const safe = trimmed.replace(/\\/g, "").replace(/"/g, "");
  return `"${safe}", ui-sans-serif, system-ui, sans-serif`;
}

/**
 * Horizontal / wide logo for storefront header (`theme_config.header_logo_url`).
 * Fallback: legacy `theme_config.logo_url`, then `dealerships.logo_url` column.
 */
/**
 * Ordered logo candidates: header → legacy theme → column.
 * Skips Supabase storage URLs from a different project than `NEXT_PUBLIC_SUPABASE_URL`.
 */
export function collectDealershipLogoCandidateUrls(
  theme_config: unknown,
  columnLogoUrl?: string | null | undefined,
): string[] {
  const tc = asRecord(theme_config);
  const seen = new Set<string>();
  const candidates: string[] = [];

  function push(raw: string | undefined) {
    const value = raw?.trim();
    if (!value || seen.has(value) || !isBrandAssetUrlAccessible(value)) {
      return;
    }
    seen.add(value);
    candidates.push(value);
  }

  push(readString(tc, "logo_light_url"));
  push(readString(tc, "header_logo_url"));
  push(readString(tc, "logo_url"));
  push(columnLogoUrl?.trim() || undefined);

  return candidates;
}

/** Logo for light backgrounds (panel, print, storefront light theme). */
export function resolveDealershipLogoLightUrl(
  theme_config: unknown,
  columnLogoUrl: string | null | undefined,
): string | null {
  const tc = asRecord(theme_config);
  const light = readString(tc, "logo_light_url");
  if (light && isBrandAssetUrlAccessible(light)) {
    return light;
  }
  return resolveDealershipHeaderLogoUrl(theme_config, columnLogoUrl);
}

/** Logo for dark backgrounds (storefront dark theme). */
export function resolveDealershipLogoDarkUrl(
  theme_config: unknown,
  columnLogoUrl: string | null | undefined,
): string | null {
  const tc = asRecord(theme_config);
  const dark = readString(tc, "logo_dark_url");
  if (dark && isBrandAssetUrlAccessible(dark)) {
    return dark;
  }
  return resolveDealershipHeaderLogoUrl(theme_config, columnLogoUrl);
}

export function resolveDealershipHeaderLogoUrl(
  theme_config: unknown,
  columnLogoUrl: string | null | undefined,
): string | null {
  return collectDealershipLogoCandidateUrls(theme_config, columnLogoUrl)[0] ?? null;
}

/** Skips remote Supabase storage URLs when the app points at another project/host (common after db reset). */
function isBrandAssetUrlAccessible(url: string): boolean {
  const supabaseOrigin = readSupabaseProjectOrigin();
  if (!supabaseOrigin) {
    return true;
  }
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("supabase.co") && !parsed.hostname.includes("127.0.0.1")) {
      return true;
    }
    return parsed.origin === supabaseOrigin;
  } catch {
    return true;
  }
}

function readSupabaseProjectOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) {
    return null;
  }
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

/**
 * Footer / vertical logo (`theme_config.footer_logo_url`).
 * Fallback: header logo chain (single asset uses both placements).
 */
export function resolveDealershipFooterLogoUrl(
  theme_config: unknown,
  columnLogoUrl: string | null | undefined,
): string | null {
  const tc = asRecord(theme_config);
  const footer = readString(tc, "footer_logo_url");
  if (footer) {
    return footer;
  }
  return resolveDealershipHeaderLogoUrl(theme_config, columnLogoUrl);
}

/** @deprecated Use `resolveDealershipHeaderLogoUrl` (alias kept for older call sites). */
export function resolveDealershipLogoUrl(
  theme_config: unknown,
  columnLogoUrl: string | null | undefined,
): string | null {
  return resolveDealershipHeaderLogoUrl(theme_config, columnLogoUrl);
}

export function resolveGoogleFontsHrefFromTheme(
  theme_config: unknown,
): string | null {
  const tc = asRecord(theme_config);
  const h = readString(tc, "google_font_heading") ?? "";
  const b = readString(tc, "google_font_body") ?? "";
  return buildGoogleFontsStylesheetHref([h, b]);
}

export function resolveDealershipFaviconUrl(
  theme_config: unknown,
  columnLogoUrl?: string | null | undefined,
): string | null {
  const tc = asRecord(theme_config);
  const favicon = readString(tc, "favicon_url");
  if (favicon && isBrandAssetUrlAccessible(favicon)) {
    return favicon;
  }
  return resolveDealershipHeaderLogoUrl(theme_config, columnLogoUrl);
}

const FONT_STACKS: Record<
  DealershipFontPairId,
  { heading: string; body: string }
> = {
  default: {
    heading:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  serif_editorial: {
    heading: 'Georgia, "Noto Serif", ui-serif, serif',
    body: 'Manrope, ui-sans-serif, system-ui, sans-serif',
  },
  sans_geometric: {
    heading: 'Manrope, ui-sans-serif, system-ui, sans-serif',
    body: 'Manrope, ui-sans-serif, system-ui, sans-serif',
  },
};

export function resolveDealershipFontStacks(theme_config: unknown): {
  heading: string;
  body: string;
} {
  const tc = asRecord(theme_config);
  const googleHeading = readString(tc, "google_font_heading");
  const googleBody = readString(tc, "google_font_body");

  const rawPair = readString(tc, "font_pair_id");
  const id: DealershipFontPairId =
    rawPair === "serif_editorial" || rawPair === "sans_geometric" || rawPair === "default"
      ? rawPair
      : "default";
  const preset = FONT_STACKS[id];

  if (!googleHeading && !googleBody) {
    return preset;
  }

  const headingStack = googleHeading
    ? quotedGoogleFontCssStack(googleHeading)
    : googleBody
      ? quotedGoogleFontCssStack(googleBody)
      : preset.heading;

  const bodyStack = googleBody
    ? quotedGoogleFontCssStack(googleBody)
    : googleHeading
      ? quotedGoogleFontCssStack(googleHeading)
      : preset.body;

  return { heading: headingStack, body: bodyStack };
}
