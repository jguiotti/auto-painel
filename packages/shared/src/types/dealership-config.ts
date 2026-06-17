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

export type StorefrontHomeLayoutKey = "1" | "2" | "3";

export interface StorefrontHomeTrustStat {
  value: string;
  label: string;
}

/** Per-layout homepage copy overrides (customer-site whitelabel). */
export interface StorefrontHomeLayoutCopy {
  hero_eyebrow?: string;
  hero_headline?: string;
  hero_subheadline?: string;
  hero_cta_stock?: string;
  hero_cta_whatsapp?: string;
  hero_browse_stock?: string;
  hero_sidecard_title?: string;
  hero_sidecard_items?: string[];
  heritage_eyebrow?: string;
  heritage_headline?: string;
  heritage_body?: string;
  heritage_stats?: StorefrontHomeTrustStat[];
  finance_title?: string;
  finance_subtitle?: string;
  finance_cta?: string;
  trust_stats?: StorefrontHomeTrustStat[];
}

export interface StorefrontHomeConfig {
  hero_background_url?: string;
  by_layout?: Partial<Record<StorefrontHomeLayoutKey, StorefrontHomeLayoutCopy>>;
}

export interface DealershipContentConfig {
  about_text?: string;
  /** @deprecated Prefer hq_address for structured HQ mailing address. */
  address?: string;
  hq_address?: BrazilianAddressFields;
  social_links?: Record<string, string>;
  sells_motorcycles?: boolean;
  storefront_home?: StorefrontHomeConfig;
}
