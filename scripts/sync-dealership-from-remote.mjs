#!/usr/bin/env node
/**
 * Copies one dealership row (+ matriz unit) from remote Supabase to local.
 * Updates the local row matched by slug (keeps local UUID; branding URLs stay remote).
 *
 * Usage:
 *   npm run sync:dealership-from-remote -- guiotti
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

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

function fetchRemoteServiceRoleKey(projectRef, accessToken) {
  const result = spawnSync(
    "npx",
    ["supabase", "projects", "api-keys", "--project-ref", projectRef],
    {
      encoding: "utf8",
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken },
    },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || "Failed to fetch remote API keys");
  }

  const line = result.stdout
    .split("\n")
    .find((row) => row.includes("service_role"));
  if (!line) {
    throw new Error("Remote service_role key not found");
  }

  const parts = line.trim().split(/\s+/);
  return parts[parts.length - 1];
}

async function main() {
  const slug = process.argv[2]?.trim();
  if (!slug) {
    console.error("Usage: npm run sync:dealership-from-remote -- <slug>");
    process.exit(1);
  }

  const env = loadEnvLocal();
  const projectRef = env.get("SUPABASE_PROJECT_REF")?.trim();
  const accessToken = env.get("SUPABASE_ACCESS_TOKEN")?.trim();
  const localUrl = env.get("NEXT_PUBLIC_SUPABASE_URL")?.trim();
  const localServiceKey = env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!projectRef || !accessToken) {
    throw new Error("Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN in .env.local");
  }
  if (!localUrl?.includes("127.0.0.1") && !localUrl?.includes("localhost")) {
    throw new Error(
      "Local URL must point at Supabase Docker (127.0.0.1). Refusing to overwrite remote.",
    );
  }
  if (!localServiceKey) {
    throw new Error("Missing local SUPABASE_SERVICE_ROLE_KEY");
  }

  const remoteUrl = `https://${projectRef}.supabase.co`;
  const remoteServiceKey = fetchRemoteServiceRoleKey(projectRef, accessToken);

  const remote = createClient(remoteUrl, remoteServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const local = createClient(localUrl, localServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: remoteRow, error: remoteError } = await remote
    .from("dealerships")
    .select(
      "id, name, slug, logo_url, whatsapp_number, contact_email, status, layout_id, pricing_plan_id, theme_settings, theme_config, content_config, custom_domain, cnpj, subscription_plan, subscription_status",
    )
    .eq("slug", slug)
    .single();

  if (remoteError || !remoteRow) {
    throw new Error(`Remote dealership "${slug}" not found: ${remoteError?.message}`);
  }

  const { data: localRow, error: localLookupError } = await local
    .from("dealerships")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (localLookupError) {
    throw new Error(`Failed to lookup local dealership: ${localLookupError.message}`);
  }
  if (!localRow?.id) {
    throw new Error(
      `Local dealership "${slug}" not found. Run npm run supabase:reset first (seed creates demo slugs).`,
    );
  }

  const { data: remoteUnit, error: unitError } = await remote
    .from("dealership_units")
    .select("name, address, sort_order")
    .eq("dealership_id", remoteRow.id)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (unitError) {
    throw new Error(`Failed to load remote unit: ${unitError.message}`);
  }

  const localPayload = {
    name: remoteRow.name,
    logo_url: remoteRow.logo_url,
    whatsapp_number: remoteRow.whatsapp_number,
    contact_email: remoteRow.contact_email,
    status: remoteRow.status,
    layout_id: remoteRow.layout_id,
    theme_settings: remoteRow.theme_settings,
    theme_config: remoteRow.theme_config,
    content_config: remoteRow.content_config,
    custom_domain: remoteRow.custom_domain,
    cnpj: remoteRow.cnpj,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await local
    .from("dealerships")
    .update(localPayload)
    .eq("slug", slug);

  if (updateError) {
    throw new Error(`Failed to update local dealership: ${updateError.message}`);
  }

  if (remoteUnit) {
    const { data: existingUnit } = await local
      .from("dealership_units")
      .select("id")
      .eq("dealership_id", localRow.id)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    const unitPayload = {
      name: remoteUnit.name,
      address: remoteUnit.address,
      sort_order: remoteUnit.sort_order ?? 0,
      updated_at: new Date().toISOString(),
    };

    if (existingUnit?.id) {
      const { error: unitUpdateError } = await local
        .from("dealership_units")
        .update(unitPayload)
        .eq("id", existingUnit.id);
      if (unitUpdateError) {
        throw new Error(`Failed to update local unit: ${unitUpdateError.message}`);
      }
    } else {
      const { error: unitInsertError } = await local
        .from("dealership_units")
        .insert({ ...unitPayload, dealership_id: localRow.id });
      if (unitInsertError) {
        throw new Error(`Failed to insert local unit: ${unitInsertError.message}`);
      }
    }
  }

  console.log(`Synced dealership "${slug}" (local id ${localRow.id}) from remote → local.`);
  console.log("Branding URLs point at remote storage (works in dev).");
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
