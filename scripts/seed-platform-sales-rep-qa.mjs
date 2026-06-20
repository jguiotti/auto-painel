/**
 * QA seed — two platform sales reps with Auth login for E2E / RLS scripts.
 * Local Supabase only. Idempotent.
 *
 * Usage: npm run seed:platform-sales-rep-qa
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { assertSupabaseLocalOnly } from "./lib/assert-supabase-local-only.mjs";

const REPS = [
  {
    email: "rep.a@autopainel.demo",
    password: "RepDemo123!",
    full_name: "Rep QA Alpha",
    document_cpf: "52998224725",
  },
  {
    email: "rep.b@autopainel.demo",
    password: "RepDemo123!",
    full_name: "Rep QA Beta",
    document_cpf: "39053344705",
  },
];

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

async function findUserIdByEmail(admin, email) {
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(error.message);
    }
    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match?.id) {
      return match.id;
    }
    if (data.users.length < 200) {
      break;
    }
    page += 1;
  }
  return null;
}

async function ensureAuthUser(admin, rep) {
  let userId = await findUserIdByEmail(admin, rep.email);

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: rep.email,
      password: rep.password,
      email_confirm: true,
      user_metadata: { full_name: rep.full_name },
    });
    if (error || !data.user?.id) {
      throw new Error(error?.message ?? `Failed to create ${rep.email}`);
    }
    userId = data.user.id;
    console.log(`created auth user: ${rep.email}`);
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: rep.password,
      email_confirm: true,
      user_metadata: { full_name: rep.full_name },
    });
    if (error) {
      throw new Error(error.message);
    }
    console.log(`updated auth user: ${rep.email}`);
  }

  return userId;
}

async function ensureSalesRep(admin, rep, userId) {
  const { data: existing } = await admin
    .from("platform_sales_reps")
    .select("id")
    .eq("email", rep.email)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin
      .from("platform_sales_reps")
      .update({
        full_name: rep.full_name,
        document_cpf: rep.document_cpf,
        status: "active",
        user_id: userId,
        default_commission_rate_bps: 1000,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      throw new Error(error.message);
    }
    return existing.id;
  }

  const { data, error } = await admin
    .from("platform_sales_reps")
    .insert({
      full_name: rep.full_name,
      email: rep.email,
      document_cpf: rep.document_cpf,
      status: "active",
      user_id: userId,
      default_commission_rate_bps: 1000,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? `Failed to insert sales rep ${rep.email}`);
  }

  console.log(`platform_sales_reps row: ${rep.email}`);
  return data.id;
}

async function ensureLedgerSeed(admin, repId, label) {
  const referenceMonth = new Date().toISOString().slice(0, 7) + "-01";
  const description = `QA seed — ${label}`;

  const { data: existing } = await admin
    .from("platform_commission_ledger_entries")
    .select("id")
    .eq("sales_rep_id", repId)
    .eq("description", description)
    .maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  const { data, error } = await admin.from("platform_commission_ledger_entries").insert({
    sales_rep_id: repId,
    entry_type: "commission",
    amount_cents: label === "alpha" ? 39700 : 19700,
    description,
    reference_month: referenceMonth,
    status: "pending",
  }).select("id").single();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id;
}

async function main() {
  const env = loadEnvLocal();
  const url = env.get("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !serviceKey || !anonKey) {
    throw new Error("Missing Supabase env in .env.local");
  }

  assertSupabaseLocalOnly(url, "seed:platform-sales-rep-qa");

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const repIds = [];
  for (const rep of REPS) {
    const userId = await ensureAuthUser(admin, rep);
    const repId = await ensureSalesRep(admin, rep, userId);
    repIds.push({ email: rep.email, repId, label: rep.email.includes("rep.a") ? "alpha" : "beta" });
  }

  for (const row of repIds) {
    await ensureLedgerSeed(admin, row.repId, row.label);
  }

  console.log("\nPlatform sales rep QA seed ready:");
  for (const rep of REPS) {
    console.log(`- ${rep.email} / ${rep.password}`);
  }
  console.log("\nE2E env (optional):");
  console.log(`E2E_SALES_REP_A_EMAIL=${REPS[0].email}`);
  console.log(`E2E_SALES_REP_B_EMAIL=${REPS[1].email}`);
  console.log("E2E_SALES_REP_PASSWORD=RepDemo123!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
