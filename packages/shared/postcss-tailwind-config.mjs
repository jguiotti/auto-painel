import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * PostCSS config helper for Next apps in apps/*.
 * Sets Tailwind `base` to the monorepo root so @source paths resolve reliably.
 */
export function createTailwindPostcssConfig(importMetaUrl) {
  const appDir = path.dirname(fileURLToPath(importMetaUrl));
  const monorepoRoot = path.resolve(appDir, "../..");

  return {
    plugins: {
      "@tailwindcss/postcss": {
        base: monorepoRoot,
      },
    },
  };
}
