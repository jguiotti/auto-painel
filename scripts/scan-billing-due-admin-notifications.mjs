#!/usr/bin/env node
/**
 * Runs scan_billing_due_admin_notifications (D-7 / D-3 / D-0 / overdue admin inbox).
 *
 * Usage:
 *   node scripts/scan-billing-due-admin-notifications.mjs
 *
 * Env (root .env.local or shell):
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";

import { loadRootEnvLocal } from "./lib/load-root-env.mjs";

loadRootEnvLocal();

const supabaseUrl = (
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  ""
).trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error(
    "CI: GitHub Actions secrets SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.rpc("scan_billing_due_admin_notifications");

if (error) {
  console.error("RPC scan_billing_due_admin_notifications failed:", error.message);
  process.exit(1);
}

console.log(`Notifications created or updated: ${data ?? 0}`);
