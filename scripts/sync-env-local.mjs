/**
 * Copies repo-root `.env.local` into each Next app so `next dev` loads Supabase vars
 * even if inject-monorepo-env misses a edge case. Run after editing root env.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, ".env.local");
if (!fs.existsSync(src)) {
  console.error("Missing .env.local at monorepo root.");
  process.exit(1);
}

const targets = [
  "apps/dealership-panel",
  "apps/customer-site",
  "apps/admin-master",
  "apps/marketing-site",
];

for (const rel of targets) {
  const dest = path.join(root, rel, ".env.local");
  fs.copyFileSync(src, dest);
  console.log("updated", dest);
}
