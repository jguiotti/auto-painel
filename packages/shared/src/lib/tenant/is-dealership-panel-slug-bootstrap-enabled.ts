/**
 * Optional dev-only bootstrap: `GET /painel/acesso/:slug` sets the tenant cookie without DNS.
 * Must stay **disabled in production** — a public slug path enables tenant enumeration.
 */
export function isDealershipPanelSlugBootstrapEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEALERSHIP_PANEL_SLUG_BOOTSTRAP === "true";
}
