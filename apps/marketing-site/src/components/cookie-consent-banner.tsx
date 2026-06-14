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

export function CookieConsentBanner() {
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
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-md sm:p-6"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-2">
          <p id="cookie-consent-title" className="text-base font-semibold text-white">
            Usamos cookies para melhorar sua experiência
          </p>
          <p id="cookie-consent-desc" className="text-sm text-zinc-400">
            Cookies essenciais mantêm o site funcionando. Analytics nos ajuda a entender o que
            funciona — só com seu consentimento.{" "}
            <Link
              href="/politica-de-cookies"
              className="text-marketing-accent underline-offset-4 hover:underline"
            >
              Política de cookies
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-900"
            onClick={() => persistConsent(["essential"])}
          >
            Apenas essenciais
          </Button>
          <Button
            type="button"
            className="bg-marketing-accent text-white hover:bg-marketing-accent/90"
            onClick={() => persistConsent(["essential", "analytics"])}
          >
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  );
}
