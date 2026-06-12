import { createHash, randomBytes } from "node:crypto";

import type { ClassifiedsProvider } from "@autopainel/shared/lib/dealership-features";

function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function providerUsesPkce(provider: ClassifiedsProvider): boolean {
  // OLX documents classic authorization_code with client_secret only (no PKCE).
  return provider !== "olx";
}

export function createOAuthState(): string {
  return toBase64Url(randomBytes(32));
}

export function createPkceVerifier(): string {
  return toBase64Url(randomBytes(48));
}

export function createPkceChallenge(verifier: string): string {
  const digest = createHash("sha256").update(verifier).digest();
  return toBase64Url(digest);
}
