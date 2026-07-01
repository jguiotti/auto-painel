import { isMetaOAuthDevStubEnabled } from "@autopainel/shared/lib/meta-oauth-dev-stub";

/**
 * Full integrations mock for demos / screencasts (Meta connect, carousel preview, publish).
 * Enable with INTEGRATIONS_MOCK_MODE=true — never on production customer tenants.
 */
export function isIntegrationsMockModeEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const flag = env.INTEGRATIONS_MOCK_MODE?.trim().toLowerCase();
  if (flag === "true" || flag === "1") {
    return true;
  }
  return isMetaOAuthDevStubEnabled(env);
}

export const INTEGRATIONS_MOCK_META_PAGE = {
  pageId: "mock_demo_motors_page",
  pageName: "Demo Motors — Oficial",
  instagramBusinessAccountId: "mock_demo_motors_ig",
  instagramUsername: "demo_motors_sp",
} as const;

export function buildMockCarouselPreviewUrls(params: {
  vehicleTitle: string;
  storeName: string;
  priceLabel: string;
  vehicleImageUrls: string[];
  template: "classic" | "performance" | "tech";
}): string[] {
  const accent =
    params.template === "performance"
      ? "7F1D1D"
      : params.template === "tech"
        ? "2563EB"
        : "18181b";

  const photos = params.vehicleImageUrls.filter(Boolean).slice(0, 3);
  const cover =
    photos[0] ??
    `https://placehold.co/1080x1080/${accent}/ffffff/png?text=${encodeURIComponent(params.vehicleTitle.slice(0, 24))}`;

  const slides = [cover];
  if (photos[1]) {
    slides.push(photos[1]);
  } else if (photos[0]) {
    slides.push(photos[0]);
  }

  slides.push(
    `https://placehold.co/1080x1080/${accent}/ffffff/png?text=${encodeURIComponent(`${params.storeName} · Saiba mais`)}`,
  );

  return slides;
}

export function buildMockPublishResultPayload(channels: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {
    mode: "mock",
    simulated_at: new Date().toISOString(),
  };

  if (channels.includes("facebook_page")) {
    result.facebook_page = {
      postId: `mock_fb_${crypto.randomUUID()}`,
      url: "https://www.facebook.com/demo-motors-oficial/posts/mock",
    };
  }
  if (channels.includes("instagram_feed")) {
    result.instagram_feed = {
      postId: `mock_ig_${crypto.randomUUID()}`,
      url: "https://www.instagram.com/p/mock-demo-motors/",
    };
  }

  return result;
}
