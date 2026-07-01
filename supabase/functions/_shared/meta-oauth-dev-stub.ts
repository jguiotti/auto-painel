export const META_OAUTH_DEV_STUB_CLIENT_ID = "autopainel-meta-dev-stub-client";
export const META_OAUTH_DEV_STUB_CLIENT_SECRET = "autopainel-meta-dev-stub-secret";
export const META_OAUTH_DEV_STUB_CODE_PREFIX = "autopainel_meta_dev_stub:";

export function isMetaOAuthDevStubEnabled(): boolean {
  const integrationsMock = Deno.env.get("INTEGRATIONS_MOCK_MODE")?.trim().toLowerCase();
  if (integrationsMock === "true" || integrationsMock === "1") {
    return true;
  }
  const flag = Deno.env.get("META_OAUTH_DEV_STUB")?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

export function parseMetaOAuthDevStubCode(code: string): { state: string } | null {
  if (!code.startsWith(META_OAUTH_DEV_STUB_CODE_PREFIX)) {
    return null;
  }
  const state = code.slice(META_OAUTH_DEV_STUB_CODE_PREFIX.length).trim();
  if (!state) {
    return null;
  }
  return { state };
}

export const META_OAUTH_DEV_STUB_PAGE = {
  pageId: "dev_stub_meta_page",
  pageName: "AutoPainel Demo — Página Facebook",
  instagramBusinessAccountId: "dev_stub_meta_ig",
  instagramUsername: "autopainel_demo",
} as const;
