/**
 * Provisions a platform super_admin (dealership_id null) for admin-master.
 *
 * Usage (credentials via env — do not commit passwords):
 *   SUPER_ADMIN_EMAIL=you@example.com SUPER_ADMIN_PASSWORD='...' node scripts/provision-platform-super-admin.mjs
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in root .env.local
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
  const email = process.env.SUPER_ADMIN_EMAIL?.trim();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in the environment.",
    );
    process.exit(1);
  }

  const env = loadEnvLocal();
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    env.get("NEXT_PUBLIC_SUPABASE_URL")?.trim();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userId = await findUserIdByEmail(admin, email);

  if (!userId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Super Admin" },
    });

    if (createError || !created.user?.id) {
      throw new Error(createError?.message ?? `Failed to create user ${email}`);
    }

    userId = created.user.id;
    console.log(`created auth user: ${email}`);
  } else {
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });

    if (updateError) {
      throw new Error(`Failed to update user ${email}: ${updateError.message}`);
    }

    console.log(`updated auth user: ${email}`);
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

  console.log(`super_admin profile ready: ${email} (${userId})`);

  const adminOrigin =
    process.env.NEXT_PUBLIC_ADMIN_AUTH_REDIRECT_ORIGIN?.trim() ||
    "https://admin.autopainel.com.br";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")?.trim();

  if (anonKey && process.env.SEND_PROVISION_EMAIL !== "false") {
    const pub = createClient(url, anonKey);
    const next = encodeURIComponent("/definir-senha");
    const { error: mailErr } = await pub.auth.resetPasswordForEmail(email, {
      redirectTo: `${adminOrigin.replace(/\/$/, "")}/auth/confirm?next=${next}`,
    });
    if (mailErr) {
      console.warn(`password setup email failed: ${mailErr.message}`);
      console.log("Login at admin-master /login — set password via /recuperar-senha or /painel/conta/senha.");
    } else {
      console.log(`password setup email sent to ${email}`);
    }
  } else {
    console.log("Login at admin-master /login — change password via /painel/conta/senha or /recuperar-senha.");
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
