import "server-only";

import type { ClassifiedsProvider } from "@autopainel/shared/lib/dealership-features";
import { isClassifiedsOAuthDevStubEnabled } from "@autopainel/shared/lib/classifieds-oauth-dev-stub";

import type { ClassifiedsOAuthProvider } from "@/lib/classifieds/oauth-provider";
import { CLASSIFIEDS_OAUTH_PROVIDERS } from "@/lib/classifieds/oauth-provider";
import { resolveClassifiedsOAuthProviderConfigForDealership } from "@/lib/classifieds/resolve-classifieds-oauth-config";
import { tryResolveWebMotorsPlatformConfig } from "@/lib/classifieds/resolve-webmotors-platform-config";
import { classifiedsUsesIntegratorCredentials } from "@/lib/classifieds/classifieds-connect-mode";
import { ClassifiedsOAuthNotConfiguredError } from "@/lib/classifieds/oauth-not-configured-error";

export type ClassifiedsProviderAvailability = Record<ClassifiedsProvider, boolean>;

/** True when platform/env OAuth credentials exist for the portal (not the same as plan module). */
export async function getClassifiedsProviderOAuthReady(params: {
  dealershipId: string;
  enabledProviders: ClassifiedsProvider[];
  panelOrigin?: string;
}): Promise<ClassifiedsProviderAvailability> {
  const availability: ClassifiedsProviderAvailability = {
    olx: false,
    webmotors: false,
    icarros: false,
  };

  if (isClassifiedsOAuthDevStubEnabled()) {
    for (const provider of params.enabledProviders) {
      availability[provider] = true;
    }
    return availability;
  }

  const oauthProviders = params.enabledProviders.filter((provider): provider is ClassifiedsOAuthProvider =>
    CLASSIFIEDS_OAUTH_PROVIDERS.includes(provider as ClassifiedsOAuthProvider),
  );

  await Promise.all(
    oauthProviders.map(async (provider) => {
      if (classifiedsUsesIntegratorCredentials(provider)) {
        availability[provider] = (await tryResolveWebMotorsPlatformConfig()) !== null;
        return;
      }

      try {
        await resolveClassifiedsOAuthProviderConfigForDealership({
          dealershipId: params.dealershipId,
          provider,
          panelOrigin: params.panelOrigin,
        });
        availability[provider] = true;
      } catch (error) {
        if (error instanceof ClassifiedsOAuthNotConfiguredError) {
          availability[provider] = false;
          return;
        }
        availability[provider] = false;
      }
    }),
  );

  return availability;
}

/** @deprecated Use getClassifiedsProviderOAuthReady — kept for import sites during rename. */
export const getClassifiedsProviderAvailability = getClassifiedsProviderOAuthReady;
