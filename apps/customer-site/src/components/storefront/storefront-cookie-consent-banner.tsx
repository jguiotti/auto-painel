"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@autopainel/shared/ui";

import {
  buildCookieConsentValue,
  COOKIE_CONSENT_COOKIE,
  cookieConsentCookieOptions,
  parseCookieConsent,
} from "@/lib/cookie-consent";

export function StorefrontCookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_CONSENT_COOKIE}=`))
      ?.split("=")[1];

    const levels = parseCookieConsent(existing ? decodeURIComponent(existing) : null);
    setVisible(levels.length === 0);
  }, []);

  function persistConsent(levels: ("essential" | "analytics")[]) {
    const value = buildCookieConsentValue(levels);
    document.cookie = `${COOKIE_CONSENT_COOKIE}=${encodeURIComponent(value)}; ${cookieConsentCookieOptions()}`;
    setVisible(false);
    window.location.reload();
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-black/10 bg-[var(--dealer-surface)]/95 p-4 shadow-2xl backdrop-blur-md dark:border-white/10 sm:p-6"
      role="dialog"
      aria-labelledby="storefront-cookie-consent-title"
      aria-describedby="storefront-cookie-consent-desc"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-2">
          <p
            id="storefront-cookie-consent-title"
            className="text-base font-semibold text-[var(--dealer-fg)]"
          >
            Usamos cookies para melhorar sua experiência
          </p>
          <p id="storefront-cookie-consent-desc" className="text-sm text-[var(--dealer-fg)]/70">
            Cookies essenciais mantêm o site funcionando. Analytics nos ajuda a entender o que
            funciona — só com seu consentimento.{" "}
            <Link
              href="/politica-de-cookies"
              className="text-[var(--dealer-primary)] underline-offset-4 hover:underline"
            >
              Política de cookies
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-[var(--dealer-fg)]/20 bg-transparent text-[var(--dealer-fg)] hover:bg-[var(--dealer-fg)]/5"
            onClick={() => persistConsent(["essential"])}
          >
            Apenas essenciais
          </Button>
          <Button
            type="button"
            className="bg-[var(--dealer-primary)] text-[var(--dealer-primary-fg,inherit)] hover:opacity-90"
            onClick={() => persistConsent(["essential", "analytics"])}
          >
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  );
}
