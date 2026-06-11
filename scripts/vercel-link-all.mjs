#!/usr/bin/env node
/**
 * Prints step-by-step Vercel CLI link commands for all four apps.
 * Run after: vercel login
 *
 * Usage: npm run vercel:link:all
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const apps = [
  { dir: "apps/marketing-site", name: "autopainel-marketing" },
  { dir: "apps/admin-master", name: "autopainel-admin" },
  { dir: "apps/dealership-panel", name: "autopainel-panel" },
  { dir: "apps/customer-site", name: "autopainel-customer" },
];

console.log(`Monorepo root: ${root}\n`);
console.log("For each app, run from repo root:\n");

for (const app of apps) {
  console.log(`# ${app.name}`);
  console.log(`cd ${app.dir}`);
  console.log(`vercel link --project ${app.name} --yes`);
  console.log(`cd ../..\n`);
}

console.log("Full DNS + env checklist: packages/shared/docs/VERCEL_DEPLOY.md");
