import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function getSessionSecret(): string {
  const secret = process.env.ADMIN_MASTER_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "ADMIN_MASTER_SESSION_SECRET must be set (min 16 characters).",
    );
  }
  return secret;
}

export function signAdminSession(): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ v: 1, exp }), "utf8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }
  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return false;
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }
  const [payload, sig] = parts;
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  if (sig.length !== expected.length) {
    return false;
  }
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return false;
    }
  } catch {
    return false;
  }
  try {
    const json = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: number; v?: number };
    if (json.v !== 1 || typeof json.exp !== "number") {
      return false;
    }
    if (json.exp < Date.now()) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
}

export function verifyAdminPassword(plain: string): boolean {
  const expected = process.env.ADMIN_MASTER_PASSWORD ?? "";
  if (expected.length === 0 || plain.length !== expected.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(plain), Buffer.from(expected));
  } catch {
    return false;
  }
}
