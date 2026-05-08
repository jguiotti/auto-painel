"use client";

import { useEffect } from "react";

interface DealershipFontsLinkProps {
  href: string | null;
}

/** Injects Google Fonts stylesheet for the active tenant (client-only). */
export function DealershipFontsLink({ href }: DealershipFontsLinkProps) {
  useEffect(() => {
    if (!href) {
      return;
    }
    const linkId = `dealer-google-font-${hashHref(href)}`;
    if (document.getElementById(linkId)) {
      return;
    }
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.dealerGoogleFont = "1";
    document.head.appendChild(link);
    return () => {
      document.head.querySelector(`#${CSS.escape(linkId)}`)?.remove();
    };
  }, [href]);

  return null;
}

function hashHref(h: string): string {
  let s = 0;
  for (let i = 0; i < h.length; i++) {
    s = (Math.imul(31, s) + h.charCodeAt(i)) | 0;
  }
  return String(Math.abs(s));
}
