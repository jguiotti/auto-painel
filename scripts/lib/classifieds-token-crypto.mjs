/**
 * AES-GCM encrypt compatible with Supabase Edge classifieds-crypto / shared token crypto.
 */
import { createHash, randomBytes } from "node:crypto";

function toBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

export function encryptClassifiedsSecretValue(plaintext, secret) {
  const key = createHash("sha256").update(secret, "utf8").digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const cipherBytes = Buffer.concat([encrypted, tag]);
  return `${toBase64(iv)}.${toBase64(cipherBytes)}`;
}
