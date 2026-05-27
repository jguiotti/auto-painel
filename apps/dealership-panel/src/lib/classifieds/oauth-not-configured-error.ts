import type { ClassifiedsProvider } from "@/lib/classifieds/oauth-provider";

export class ClassifiedsOAuthNotConfiguredError extends Error {
  readonly code = "oauth_not_configured" as const;
  readonly provider: ClassifiedsProvider;

  constructor(provider: ClassifiedsProvider) {
    super(`Classifieds provider ${provider} is not configured.`);
    this.name = "ClassifiedsOAuthNotConfiguredError";
    this.provider = provider;
  }
}
