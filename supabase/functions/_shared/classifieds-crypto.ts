const encoder = new TextEncoder();
const decoder = new TextDecoder();

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

async function getAesKey(secret: string): Promise<CryptoKey> {
  const secretBytes = encoder.encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", secretBytes);
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptSecretValue(
  plaintext: string,
  secret: string,
): Promise<string> {
  const key = await getAesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext),
  );

  const cipherBytes = new Uint8Array(cipherBuffer);
  return `${toBase64(iv)}.${toBase64(cipherBytes)}`;
}

/**
 * Inverse of {@link encryptSecretValue} — parses `ivBase64.cipherBase64` (AES-GCM).
 */
export async function decryptSecretValue(
  ciphertext: string,
  secret: string,
): Promise<string> {
  const trimmed = ciphertext.trim();
  const dot = trimmed.indexOf(".");
  if (dot < 1 || dot === trimmed.length - 1) {
    throw new Error("Invalid ciphertext format.");
  }
  const ivPart = trimmed.slice(0, dot);
  const cipherPart = trimmed.slice(dot + 1);
  const iv = fromBase64(ivPart);
  const cipherBytes = fromBase64(cipherPart);
  const key = await getAesKey(secret);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipherBytes,
  );
  return decoder.decode(plainBuffer);
}
