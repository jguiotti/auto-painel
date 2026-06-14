import {
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_MAX_AGE_SECONDS,
} from "./legal/constants";

export type CookieConsentLevel = "essential" | "analytics";

export function parseCookieConsent(value: string | undefined | null): CookieConsentLevel[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter(
      (part): part is CookieConsentLevel =>
        part === "essential" || part === "analytics",
    );
}

export function hasAnalyticsConsent(value: string | undefined | null): boolean {
  return parseCookieConsent(value).includes("analytics");
}

export function buildCookieConsentValue(levels: CookieConsentLevel[]): string {
  const unique = Array.from(new Set(levels));
  if (!unique.includes("essential")) {
    unique.unshift("essential");
  }
  return unique.join(",");
}

export function cookieConsentCookieOptions(): string {
  return `path=/; max-age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export { COOKIE_CONSENT_COOKIE };
