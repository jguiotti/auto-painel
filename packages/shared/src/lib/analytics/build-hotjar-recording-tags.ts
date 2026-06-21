import type { AutopainelAppSurface, AutopainelGtmDataLayerContext } from "./gtm-types";

const SURFACE_LABELS: Record<AutopainelAppSurface, string> = {
  marketing: "Marketing",
  admin: "Admin",
  dealership_panel: "Painel loja",
  customer_storefront: "Vitrine",
};

/**
 * Tags applied to Hotjar recordings via `hj('tagRecording', …)` for filtering in one site.
 */
export function buildHotjarRecordingTags(
  context: Pick<
    AutopainelGtmDataLayerContext,
    "ap_app_surface" | "ap_dealership_slug"
  >,
): string[] {
  const tags = [
    context.ap_app_surface,
    SURFACE_LABELS[context.ap_app_surface],
  ];

  if (context.ap_dealership_slug) {
    tags.push(`loja:${context.ap_dealership_slug}`);
  }

  return tags;
}
