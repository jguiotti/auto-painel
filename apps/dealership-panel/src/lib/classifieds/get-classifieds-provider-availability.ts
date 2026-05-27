import "server-only";

import type { ClassifiedsProvider } from "@/lib/classifieds/oauth-provider";
import { CLASSIFIEDS_PROVIDERS } from "@/lib/classifieds/oauth-provider";
import { resolveClassifiedsOAuthProviderConfigForDealership } from "@/lib/classifieds/resolve-classifieds-oauth-config";
import { ClassifiedsOAuthNotConfiguredError } from "@/lib/classifieds/oauth-not-configured-error";

export type ClassifiedsProviderAvailability = Record<ClassifiedsProvider, boolean>;

export async function getClassifiedsProviderAvailability(params: {
  dealershipId: string;
}): Promise<ClassifiedsProviderAvailability> {
  const availability: ClassifiedsProviderAvailability = {
    olx: false,
    webmotors: false,
  };

  await Promise.all(
    CLASSIFIEDS_PROVIDERS.map(async (provider) => {
      try {
        await resolveClassifiedsOAuthProviderConfigForDealership({
          dealershipId: params.dealershipId,
          provider,
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
