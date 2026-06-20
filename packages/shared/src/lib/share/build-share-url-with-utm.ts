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

export function buildFacebookShareUrl(pageUrl: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
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
