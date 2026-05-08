import { createHash, randomBytes } from "node:crypto";

function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
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
