import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const AUTH_PATHS = [
  path.join(os.homedir(), "Library/Application Support/com.vercel.cli/auth.json"),
  path.join(os.homedir(), ".local/share/com.vercel.cli/auth.json"),
];

/**
 * Resolves Vercel bearer token from VERCEL_TOKEN env or logged-in CLI session.
 */
export function resolveVercelToken() {
  const fromEnv = process.env.VERCEL_TOKEN?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  for (const authPath of AUTH_PATHS) {
    if (!fs.existsSync(authPath)) {
      continue;
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(authPath, "utf8"));
      if (typeof parsed.token === "string" && parsed.token.length > 0) {
        return parsed.token;
      }
    } catch {
      // try next path
    }
  }

  return null;
}
