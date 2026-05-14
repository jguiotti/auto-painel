/**
 * Shapes stored in dealerships.theme_config / content_config (JSON columns).
 */

/** Closed list for optional heading/body font stacks (customer-site). */
export type DealershipFontPairId =
  | "default"
  | "serif_editorial"
  | "sans_geometric";

export type StorefrontThemeMode = "light" | "dark";

export interface DealershipThemeConfig {
  primary_color?: string;
  secondary_color?: string;
  storefront_theme_mode?: StorefrontThemeMode;
  /** @deprecated Mirrors header logo URL for legacy reads; prefer `header_logo_url`. */
  logo_url?: string;
  /** Wide / horizontal logo for storefront header navigation. */
  header_logo_url?: string;
  /** Tall / stacked logo for storefront footer. */
  footer_logo_url?: string;
  favicon_url?: string;
  font_pair_id?: DealershipFontPairId;
  /** Exact Google Fonts family names (validated in admin actions). */
  google_font_heading?: string;
  google_font_body?: string;
}

export interface BrazilianAddressFields {
  postal_code?: string;
  state?: string;
  city?: string;
  district?: string;
  street?: string;
  number?: string;
  complement?: string;
}

export interface DealershipContentConfig {
  about_text?: string;
  /** @deprecated Prefer hq_address for structured HQ mailing address. */
  address?: string;
  hq_address?: BrazilianAddressFields;
  social_links?: Record<string, string>;
}
