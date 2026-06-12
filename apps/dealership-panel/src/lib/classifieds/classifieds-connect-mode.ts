import type { ClassifiedsProvider } from "@autopainel/shared/lib/dealership-features";

/** Portals that connect via OAuth popup (authorization code). */
export function classifiedsUsesOAuthPopup(provider: ClassifiedsProvider): boolean {
  return provider === "olx" || provider === "icarros";
}

/** Portals that connect with integrator CRM username + password (password grant). */
export function classifiedsUsesIntegratorCredentials(provider: ClassifiedsProvider): boolean {
  return provider === "webmotors";
}
