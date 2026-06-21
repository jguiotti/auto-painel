export type AutopainelAppSurface =
  | "marketing"
  | "admin"
  | "dealership_panel"
  | "customer_storefront";

export interface AutopainelGtmDataLayerContext {
  ap_app_surface: AutopainelAppSurface;
  ap_page_hostname: string | null;
  ap_dealership_slug: string | null;
  ap_dealership_id: string | null;
  /** granted | denied — vitrine/marketing follow cookie banner; painel/admin default granted */
  ap_analytics_consent: "granted" | "denied";
  /** Hotjar recording tags (same site ID, filter by tag in dashboard) */
  ap_hotjar_tags: string[];
}

export interface AutopainelGtmRuntime {
  containerId: string;
  dataLayer: AutopainelGtmDataLayerContext;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    /** Set server-side when GA4_INTERNAL_TRAFFIC_IPS matches the visitor. */
    __AP_ANALYTICS_EXCLUDED?: boolean;
  }
}
