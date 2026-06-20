/**
 * Platform sales squad cron helper (service role).
 * Usage:
 *   node scripts/platform-sales-cron.mjs monthly
 *   node scripts/platform-sales-cron.mjs payout [--month YYYY-MM-01]
 *   node scripts/platform-sales-cron.mjs mark-paid --batch <uuid>
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

function parseArgs(argv) {
  const args = { mode: argv[2] ?? "monthly", month: null, batchId: null };
  for (let i = 3; i < argv.length; i += 1) {
    if (argv[i] === "--month" && argv[i + 1]) {
      args.month = argv[i + 1];
      i += 1;
    } else if (argv[i] === "--batch" && argv[i + 1]) {
      args.batchId = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

const env = loadEnvLocal();
const url = env.get("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { mode, month, batchId } = parseArgs(process.argv);

if (mode === "monthly") {
  const { data, error } = await admin.rpc("generate_monthly_commission_ledger", {
    p_reference_month: month,
  });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log("generate_monthly_commission_ledger:", data);
} else if (mode === "payout") {
  if (!month) {
    const prev = new Date();
    prev.setUTCDate(1);
    prev.setUTCMonth(prev.getUTCMonth() - 1);
    const defaultMonth = prev.toISOString().slice(0, 10);
    console.error(`--month required (e.g. ${defaultMonth})`);
    process.exit(1);
  }
  const { data, error } = await admin.rpc("generate_payout_batch", {
    p_reference_month: month,
    p_payment_date: null,
  });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log("generate_payout_batch batch_id:", data);
} else if (mode === "mark-paid") {
  if (!batchId) {
    console.error("--batch <uuid> required");
    process.exit(1);
  }
  const { data, error } = await admin.rpc("mark_payout_batch_paid", {
    p_payout_batch_id: batchId,
  });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log("mark_payout_batch_paid:", data);
} else {
  console.error("Unknown mode. Use: monthly | payout | mark-paid");
  process.exit(1);
}
