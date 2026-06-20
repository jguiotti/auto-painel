/**
 * QA — RLS smoke for platform sales squad (local Supabase).
 * Requires: npm run seed:platform-sales-rep-qa
 *
 * Usage: npm run qa:platform-sales-squad-rls
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { assertSupabaseLocalOnly } from "./lib/assert-supabase-local-only.mjs";

const REP_A = {
  email: process.env.E2E_SALES_REP_A_EMAIL?.trim() || "rep.a@autopainel.demo",
  password: process.env.E2E_SALES_REP_PASSWORD?.trim() || "RepDemo123!",
};

const REP_B = {
  email: process.env.E2E_SALES_REP_B_EMAIL?.trim() || "rep.b@autopainel.demo",
  password: process.env.E2E_SALES_REP_PASSWORD?.trim() || "RepDemo123!",
};

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(envPath, "utf8");
  const map = new Map();
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const idx = trimmed.indexOf("=");
    if (idx === -1) {
      continue;
    }
    map.set(trimmed.slice(0, idx), trimmed.slice(idx + 1));
  }
  return map;
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

async function signInClient(url, anonKey, email, password) {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw new Error(`Sign in failed for ${email}: ${error?.message ?? "no user"}`);
  }
  return client;
}

async function main() {
  const env = loadEnvLocal();
  const url = env.get("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceKey = env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !anonKey || !serviceKey) {
    throw new Error("Missing Supabase env in .env.local");
  }

  assertSupabaseLocalOnly(url, "qa:platform-sales-squad-rls");

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const clientA = await signInClient(url, anonKey, REP_A.email, REP_A.password);
  const clientB = await signInClient(url, anonKey, REP_B.email, REP_B.password);

  const { data: repIdA, error: repIdAErr } = await clientA.rpc("current_platform_sales_rep_id");
  const { data: repIdB, error: repIdBErr } = await clientB.rpc("current_platform_sales_rep_id");

  if (repIdAErr || !repIdA) {
    fail(`Rep A missing current_platform_sales_rep_id — run npm run seed:platform-sales-rep-qa`);
    return;
  }
  if (repIdBErr || !repIdB) {
    fail(`Rep B missing current_platform_sales_rep_id — run npm run seed:platform-sales-rep-qa`);
    return;
  }
  pass("Both reps resolve current_platform_sales_rep_id");

  const { data: ledgerA } = await clientA
    .from("platform_commission_ledger_entries")
    .select("id, sales_rep_id, description");

  const { data: ledgerB } = await clientB
    .from("platform_commission_ledger_entries")
    .select("id, sales_rep_id, description");

  const leakA = (ledgerA ?? []).some((row) => row.sales_rep_id !== repIdA);
  const leakB = (ledgerB ?? []).some((row) => row.sales_rep_id !== repIdB);

  if (leakA) {
    fail("Rep A sees ledger rows from another rep");
  } else {
    pass(`Rep A ledger isolation (${(ledgerA ?? []).length} row(s))`);
  }

  if (leakB) {
    fail("Rep B sees ledger rows from another rep");
  } else {
    pass(`Rep B ledger isolation (${(ledgerB ?? []).length} row(s))`);
  }

  const { data: repsAsA } = await clientA.from("platform_sales_reps").select("id, email");
  const foreignReps = (repsAsA ?? []).filter((row) => row.id !== repIdA);
  if (foreignReps.length > 0) {
    fail(`Rep A can read other platform_sales_reps rows: ${foreignReps.map((r) => r.email).join(", ")}`);
  } else {
    pass("Rep A reads only own platform_sales_reps row");
  }

  const { error: insertErr } = await clientA.from("platform_sales_reps").insert({
    full_name: "RLS probe",
    email: `probe-${Date.now()}@autopainel.demo`,
    status: "active",
    default_commission_rate_bps: 1000,
  });

  if (!insertErr) {
    fail("Rep A was able to INSERT platform_sales_reps (should be blocked)");
  } else {
    pass("Rep A cannot INSERT platform_sales_reps");
  }

  const { error: rpcErr } = await clientA.rpc("transfer_sales_rep_portfolio", {
    p_from_sales_rep_id: repIdA,
    p_to_sales_rep_id: repIdB,
    p_effective_at: new Date().toISOString(),
  });

  if (!rpcErr) {
    fail("Rep A was able to call transfer_sales_rep_portfolio (should be forbidden)");
  } else {
    pass("Rep A cannot call transfer_sales_rep_portfolio RPC");
  }

  const { count: adminRepCount } = await admin
    .from("platform_sales_reps")
    .select("id", { count: "exact", head: true });

  pass(`Service role sees ${adminRepCount ?? 0} platform_sales_reps (admin path OK)`);

  if (process.exitCode === 1) {
    console.error("\nRLS QA finished with failures.");
  } else {
    console.log("\nRLS QA finished — all checks passed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
