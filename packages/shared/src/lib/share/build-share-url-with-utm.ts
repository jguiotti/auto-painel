export interface ShareUtmParams {
  medium: string;
  campaign?: string;
  content?: string;
}

/**
 * Appends UTM query params to a share URL for attribution in GA4.
 */
export function buildShareUrlWithUtm(pageUrl: string, utm: ShareUtmParams): string {
  try {
    const url = new URL(pageUrl);
    url.searchParams.set("utm_source", "share");
    url.searchParams.set("utm_medium", utm.medium);
    url.searchParams.set("utm_campaign", utm.campaign ?? "vehicle_share");
    if (utm.content?.trim()) {
      url.searchParams.set("utm_content", utm.content.trim());
    }
    return url.toString();
  } catch {
    return pageUrl;
  }
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Canonical page URL for social crawlers (no query/hash).
 * Facebook sharer rejects or mishandles long UTM query strings.
 */
export function buildCanonicalSharePageUrl(pageUrl: string): string {
  try {
    const url = new URL(pageUrl);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return pageUrl.split("#")[0]?.split("?")[0] ?? pageUrl;
  }
}

export function buildFacebookShareUrl(pageUrl: string, options?: { mobile?: boolean }): string {
  const canonical = buildCanonicalSharePageUrl(pageUrl);
  const encoded = encodeURIComponent(canonical);
  if (options?.mobile) {
    return `https://m.facebook.com/sharer.php?u=${encoded}`;
  }
  return `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
}

/**
 * Opens Facebook share dialog in desktop browsers.
 * Do not use on iOS: facebook.com sharer URLs open the native app via universal links
 * without passing the share URL to the composer.
 */
export function openFacebookShare(pageUrl: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const isIos =
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIos) {
    return;
  }

  const shareUrl = buildFacebookShareUrl(pageUrl);

  const popup = window.open(
    shareUrl,
    "facebook-share-dialog",
    "width=600,height=680,menubar=no,toolbar=no",
  );

  if (!popup) {
    window.location.assign(shareUrl);
  }
}

export function isIosShareDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isMobileShareDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || isIosShareDevice();
}

/**
 * Native share sheet (iOS/Android). On iOS, Facebook reads embedded URL in text more reliably than url-only.
 */
export async function sharePageViaNativeSheet(payload: {
  url: string;
  title?: string;
  text?: string;
}): Promise<"shared" | "aborted" | "unavailable"> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "unavailable";
  }

  const ios = isIosShareDevice();
  const shareText = [payload.text?.trim(), payload.url].filter(Boolean).join("\n");

  const attempts: ShareData[] = ios
    ? [
        { text: shareText },
        { url: payload.url },
        { title: payload.title, text: shareText },
      ]
    : [
        {
          url: payload.url,
          ...(payload.title ? { title: payload.title } : {}),
          ...(payload.text ? { text: payload.text } : {}),
        },
      ];

  for (const shareData of attempts) {
    if (typeof navigator.canShare === "function" && !navigator.canShare(shareData)) {
      continue;
    }

    try {
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return "aborted";
      }
    }
  }

  return "unavailable";
}

export function buildTwitterShareUrl(pageUrl: string, text: string): string {
  const params = new URLSearchParams({
    url: pageUrl,
    text,
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function buildLinkedInShareUrl(pageUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
}

export function buildTelegramShareUrl(pageUrl: string, text: string): string {
  const params = new URLSearchParams({
    url: pageUrl,
    text,
  });
  return `https://t.me/share/url?${params.toString()}`;
}
