import { randomBytes } from "node:crypto";

import type { ClassifiedsProvider } from "./dealership-features";

const STATE_PREFIX = "ap";

function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

/**
 * OAuth `state` carries the portal key so callbacks work when the redirect URI
 * has no query string (OLX replaces the entire query on redirect).
 */
export function createClassifiedsOAuthState(provider: ClassifiedsProvider): string {
  const nonce = toBase64Url(randomBytes(32));
  return `${STATE_PREFIX}:${provider}:${nonce}`;
}

export function parseProviderFromClassifiedsOAuthState(
  state: string,
): ClassifiedsProvider | null {
  const match = /^ap:(olx|webmotors|icarros):/.exec(state.trim());
  if (!match) {
    return null;
  }
  return match[1] as ClassifiedsProvider;
}
