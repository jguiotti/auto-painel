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

const GUIOTTI_CRM_LEAD_IDS = [
  "22222222-2222-4222-8222-222222222201",
  "22222222-2222-4222-8222-222222222202",
  "22222222-2222-4222-8222-222222222203",
  "22222222-2222-4222-8222-222222222204",
  "22222222-2222-4222-8222-222222222205",
  "22222222-2222-4222-8222-222222222206",
];

const GUIOTTI_CRM_NOTES = [
  {
    id: "33333333-3333-4333-8333-333333333301",
    lead_id: "22222222-2222-4222-8222-222222222202",
    body: "Retornamos pelo WhatsApp. Cliente pediu horário na sexta às 15h.",
  },
  {
    id: "33333333-3333-4333-8333-333333333302",
    lead_id: "22222222-2222-4222-8222-222222222204",
    body: "Venda concluída. Recibo emitido no estoque.",
  },
  {
    id: "33333333-3333-4333-8333-333333333303",
    lead_id: "22222222-2222-4222-8222-222222222203",
    body: "Cliente pediu nova simulação com 48x. Follow-up amanhã.",
  },
];

async function seedDemoCrmFollowUps(admin, { guiottiDealershipId, gestorUserId }) {
  const { error: assignError } = await admin
    .from("leads")
    .update({ assigned_user_id: gestorUserId })
    .eq("dealership_id", guiottiDealershipId)
    .in("id", GUIOTTI_CRM_LEAD_IDS);

  if (assignError) {
    throw new Error(`Failed to assign demo CRM leads: ${assignError.message}`);
  }

  const { error: createdByError } = await admin
    .from("leads")
    .update({ created_by: gestorUserId })
    .eq("id", "22222222-2222-4222-8222-222222222204");

  if (createdByError) {
    throw new Error(`Failed to set demo won lead created_by: ${createdByError.message}`);
  }

  const notes = GUIOTTI_CRM_NOTES.map((note) => ({
    ...note,
    dealership_id: guiottiDealershipId,
    author_id: gestorUserId,
  }));

  const { error: notesError } = await admin.from("lead_notes").upsert(notes, {
    onConflict: "id",
  });

  if (notesError) {
    throw new Error(`Failed to upsert demo lead notes: ${notesError.message}`);
  }

  console.log("demo CRM leads assigned + lead_notes synced for guiotti");
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

  const guiottiDealershipId = slugToId.get("guiotti");
  const gestorUserId = await findUserIdByEmail(admin, "gestor.guiotti@autopainel.demo");

  if (guiottiDealershipId && gestorUserId) {
    await seedDemoCrmFollowUps(admin, { guiottiDealershipId, gestorUserId });
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
  console.log("CRM demo: /painel/contatos on guiotti (6 leads across pipeline statuses)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
