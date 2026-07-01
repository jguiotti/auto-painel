/**
 * Dev-only OAuth stub for Meta (Facebook / Instagram Connect).
 * Enable with META_OAUTH_DEV_STUB=true — never use in production.
 */

export const META_OAUTH_DEV_STUB_CLIENT_ID = "autopainel-meta-dev-stub-client";
export const META_OAUTH_DEV_STUB_CLIENT_SECRET = "autopainel-meta-dev-stub-secret";
export const META_OAUTH_DEV_STUB_CODE_PREFIX = "autopainel_meta_dev_stub:";

export function isMetaOAuthDevStubEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const flag = env.META_OAUTH_DEV_STUB?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

export function buildMetaOAuthDevAuthorizePath(state: string): string {
  return `/api/painel/integracoes/meta/oauth/dev/authorize?state=${encodeURIComponent(state)}`;
}

export function buildMetaOAuthDevStubCode(state: string): string {
  return `${META_OAUTH_DEV_STUB_CODE_PREFIX}${state}`;
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

export function isMetaOAuthDevStubCode(code: string): boolean {
  return parseMetaOAuthDevStubCode(code) !== null;
}

export const META_OAUTH_DEV_STUB_PAGE = {
  pageId: "dev_stub_meta_page",
  pageName: "AutoPainel Demo — Página Facebook",
  instagramBusinessAccountId: "dev_stub_meta_ig",
  instagramUsername: "autopainel_demo",
} as const;
