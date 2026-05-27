/**
 * Provisions demo manager auth users for the 3 seeded dealerships.
 * Requires SUPABASE_SERVICE_ROLE_KEY in root .env.local
 *
 * Usage: npm run seed:demo-users
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEMO_PASSWORD = "LojaDemo123!";

const DEMO_USERS = [
  {
    email: "gestor.guiotti@autopainel.demo",
    fullName: "Gestor Guiotti",
    dealershipSlug: "guiotti",
  },
  {
    email: "gestor.autoprime@autopainel.demo",
    fullName: "Gestor AutoPrime",
    dealershipSlug: "autoprime",
  },
  {
    email: "gestor.ecodrive@autopainel.demo",
    fullName: "Gestor EcoDrive",
    dealershipSlug: "ecodrive",
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

async function ensureUser(admin, { email, fullName, dealershipId }) {
  let userId = await findUserIdByEmail(admin, email);

  if (!userId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !created.user?.id) {
      throw new Error(createError?.message ?? `Failed to create user ${email}`);
    }

    userId = created.user.id;
    console.log(`created auth user: ${email}`);
  } else {
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (updateError) {
      throw new Error(`Failed to update user ${email}: ${updateError.message}`);
    }

    console.log(`updated auth user: ${email}`);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      dealership_id: dealershipId,
      role: "owner",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Failed to upsert profile for ${email}: ${profileError.message}`);
  }

  console.log(`profile linked: ${email} -> ${dealershipId}`);
}

async function main() {
  const env = loadEnvLocal();
  const url = env.get("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: dealerships, error: dealershipsError } = await admin
    .from("dealerships")
    .select("id, slug")
    .in("slug", DEMO_USERS.map((item) => item.dealershipSlug));

  if (dealershipsError) {
    throw new Error(`Failed to load dealerships: ${dealershipsError.message}`);
  }

  const slugToId = new Map(dealerships.map((row) => [row.slug, row.id]));

  for (const demoUser of DEMO_USERS) {
    const dealershipId = slugToId.get(demoUser.dealershipSlug);
    if (!dealershipId) {
      throw new Error(
        `Dealership slug not found: ${demoUser.dealershipSlug}. Apply migration 20260514120000_seed_demo_dealerships_e2e.sql first.`,
      );
    }

    await ensureUser(admin, {
      email: demoUser.email,
      fullName: demoUser.fullName,
      dealershipId,
    });
  }

  console.log("\nDemo users ready (password for all):", DEMO_PASSWORD);
  console.log("Panel URLs:");
  console.log("- http://guiotti.localhost:3002/login");
  console.log("- http://autoprime.localhost:3002/login");
  console.log("- http://ecodrive.localhost:3002/login");
  console.log("Storefront URLs:");
  console.log("- http://guiotti.localhost:3003");
  console.log("- http://autoprime.localhost:3003");
  console.log("- http://ecodrive.localhost:3003");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
