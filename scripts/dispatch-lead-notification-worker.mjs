#!/usr/bin/env node
/**
 * Triggers notify-dealership-new-lead Edge Function (processes lead_notification_outbox).
 *
 * Usage:
 *   node scripts/dispatch-lead-notification-worker.mjs
 *
 * Env (root .env.local or shell):
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { loadRootEnvLocal } from "./lib/load-root-env.mjs";

loadRootEnvLocal();
const supabaseUrl = (
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  ""
).trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  console.error(
    "CI: configure GitHub Actions secrets SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY",
  );
  console.error(
    "Local: root .env.local (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)",
  );
  process.exit(1);
}

const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/notify-dealership-new-lead`;

const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ limit: 20 }),
});

const text = await response.text();
console.log(`HTTP ${response.status}`);
console.log(text);

if (!response.ok) {
  process.exit(1);
}
