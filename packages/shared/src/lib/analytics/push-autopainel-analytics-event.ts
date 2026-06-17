/**
 * Pushes a structured event to GTM dataLayer for cross-app reporting in GA4.
 * Context fields (ap_app_surface, ap_dealership_slug) are set on page load;
 * events add ap_event + optional dimensions.
 */
export interface AutopainelAnalyticsEventPayload {
  /** Snake_case event name, e.g. lead_form_submit */
  ap_event: string;
  ap_event_category?: string;
  ap_event_label?: string;
  ap_event_value?: number;
  [key: string]: string | number | boolean | null | undefined;
}

export function pushAutopainelAnalyticsEvent(
  payload: AutopainelAnalyticsEventPayload,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event: "ap_custom_event",
    ...payload,
  });
}
