import { isMetaOAuthDevStubEnabled } from "./meta-oauth-dev-stub.ts";

export function isIntegrationsMockModeEnabled(): boolean {
  const flag = Deno.env.get("INTEGRATIONS_MOCK_MODE")?.trim().toLowerCase();
  if (flag === "true" || flag === "1") {
    return true;
  }
  return isMetaOAuthDevStubEnabled();
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
