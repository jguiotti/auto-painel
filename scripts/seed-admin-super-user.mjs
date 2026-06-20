/**
 * Provisions (or resets) a platform super_admin for admin-master.
 * Requires SUPABASE_SERVICE_ROLE_KEY in root .env.local
 *
 * Usage: npm run seed:admin-user
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { assertSupabaseLocalOnly } from "./lib/assert-supabase-local-only.mjs";

const ADMIN_EMAIL = "operador@autopainel.demo";
const ADMIN_PASSWORD = "AdminAuto2026!";
const ADMIN_FULL_NAME = "Operador AutoPainel";

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
  const perPage = 200;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match?.id) {
      return match.id;
    }

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
}

async function main() {
  const env = loadEnvLocal();
  const url = env.get("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  assertSupabaseLocalOnly(url, "seed:admin-user");

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userId = await findUserIdByEmail(admin, ADMIN_EMAIL);

  if (!userId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_FULL_NAME },
    });

    if (createError || !created.user?.id) {
      throw new Error(createError?.message ?? `Failed to create user ${ADMIN_EMAIL}`);
    }

    userId = created.user.id;
    console.log(`created auth user: ${ADMIN_EMAIL}`);
  } else {
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_FULL_NAME },
    });

    if (updateError) {
      throw new Error(`Failed to update user ${ADMIN_EMAIL}: ${updateError.message}`);
    }

    console.log(`updated auth user: ${ADMIN_EMAIL}`);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      dealership_id: null,
      role: "super_admin",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Failed to upsert profile: ${profileError.message}`);
  }

  console.log(`profile linked: ${ADMIN_EMAIL} (super_admin)`);

  console.log("\nAdmin master ready:");
  console.log(`- URL: http://localhost:3001/login`);
  console.log(`- E-mail: ${ADMIN_EMAIL}`);
  console.log(`- Senha: ${ADMIN_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
