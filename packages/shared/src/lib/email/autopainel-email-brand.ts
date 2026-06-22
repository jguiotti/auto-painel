import { resolveAutopainelSiteUrl } from "../autopainel-site-url";

/** Dark/color horizontal logo (same asset as admin-master). */
export function resolveAutopainelTransactionalLogoUrl(): string {
  const override = process.env.AUTOPAINEL_TRANSACTIONAL_LOGO_URL?.trim();
  if (override) {
    return override;
  }
  return `${resolveAutopainelSiteUrl()}/logo-autopainel-horizontal-color.png`;
}

export const AUTOPAINEL_EMAIL_PRIMARY = "#18181b";
