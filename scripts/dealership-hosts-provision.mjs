#!/usr/bin/env node
/**
 * Registers dealership hostnames on Vercel (storefront + panel) and prints Registro.br DNS rows.
 *
 * Prerequisites:
 *   - vercel login  OR  VERCEL_TOKEN in env
 *   - Slug already exists in Supabase (`dealerships.slug`)
 *
 * Usage:
 *   npm run dealership:hosts:provision -- demo
 *   npm run dealership:hosts:provision -- demo guiotti --dry-run
 *   npm run dealership:hosts:provision -- demo --cloudflare
 *   npm run dealership:hosts:provision -- --wildcards-only --cloudflare
 *
 * Env (optional Cloudflare — skips manual Registro.br per slug when wildcards exist):
 *   CLOUDFLARE_API_TOKEN
 *   CLOUDFLARE_ZONE_ID   (zone autopainel.com.br)
 */
import { loadRootEnvLocal } from "./lib/load-root-env.mjs";
import { resolveVercelToken } from "./lib/vercel-auth-token.mjs";

loadRootEnvLocal();

const dryRun = process.argv.includes("--dry-run");
const useCloudflare = process.argv.includes("--cloudflare");
const wildcardsOnly = process.argv.includes("--wildcards-only");
const slugs = process.argv
  .slice(2)
  .filter((arg) => !arg.startsWith("--"))
  .map((slug) => slug.trim().toLowerCase())
  .filter(Boolean);

const TEAM_SLUG = process.env.VERCEL_TEAM_SLUG?.trim() || "odona-project";
const PLATFORM_ROOT = process.env.PLATFORM_ROOT_DOMAIN?.trim() || "autopainel.com.br";
const PANEL_ROOT = process.env.PLATFORM_PANEL_ROOT_DOMAIN?.trim() || "loja.autopainel.com.br";

const VERCEL_PROJECTS = {
  storefront: process.env.VERCEL_CUSTOMER_PROJECT?.trim() || "auto-painel-customer-site",
  panel: process.env.VERCEL_PANEL_PROJECT?.trim() || "auto-painel-dealership-panel",
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function usage() {
  console.log(`Usage: npm run dealership:hosts:provision -- <slug> [slug2 ...] [--dry-run] [--cloudflare]
       npm run dealership:hosts:provision -- --wildcards-only --cloudflare

Registers:
  https://{slug}.${PLATFORM_ROOT}
  https://{slug}.${PANEL_ROOT}

Vercel projects:
  storefront → ${VERCEL_PROJECTS.storefront}
  panel        → ${VERCEL_PROJECTS.panel}
`);
}

function hostnamesForSlug(slug) {
  return {
    storefront: `${slug}.${PLATFORM_ROOT}`,
    panel: `${slug}.${PANEL_ROOT}`,
  };
}

async function vercelFetch(token, pathname, { method = "GET", body } = {}) {
  const url = new URL(pathname, "https://api.vercel.com");
  url.searchParams.set("teamId", TEAM_SLUG);

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

async function ensureProjectDomain(token, projectName, hostname) {
  if (dryRun) {
    console.log(`  [dry-run] Vercel add ${hostname} → ${projectName}`);
    return { created: false, hostname };
  }

  const add = await vercelFetch(token, `/v10/projects/${encodeURIComponent(projectName)}/domains`, {
    method: "POST",
    body: { name: hostname },
  });

  if (add.ok) {
    console.log(`  ✓ Vercel: ${hostname} → ${projectName}`);
    return { created: true, hostname };
  }

  const message = add.data?.error?.message ?? "";
  if (add.status === 409 || /already|exists|assigned/i.test(message)) {
    console.log(`  · Vercel: ${hostname} já registado (${projectName})`);
    return { created: false, hostname };
  }

  throw new Error(`Vercel ${hostname} (${projectName}): ${message || add.status}`);
}

async function fetchRecommendedCname(token, hostname) {
  const { ok, data } = await vercelFetch(token, `/v6/domains/${encodeURIComponent(hostname)}/config`);
  if (!ok) {
    throw new Error(`DNS config ${hostname}: ${data?.error?.message ?? "unknown"}`);
  }
  const primary = data.recommendedCNAME?.[0]?.value;
  if (!primary) {
    throw new Error(`Sem CNAME recomendado para ${hostname}`);
  }
  return primary;
}

async function ensureCloudflareCname({ name, content, comment }) {
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const zoneId = process.env.CLOUDFLARE_ZONE_ID?.trim();
  if (!token || !zoneId) {
    throw new Error("CLOUDFLARE_API_TOKEN e CLOUDFLARE_ZONE_ID são obrigatórios com --cloudflare");
  }

  const listUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(name)}`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listRes.json();
  if (!listData.success) {
    throw new Error(`Cloudflare list ${name}: ${listData.errors?.[0]?.message ?? "failed"}`);
  }

  const existing = listData.result?.[0];
  if (existing) {
    if (existing.content === content.replace(/\.$/, "")) {
      console.log(`  · Cloudflare: ${name} já aponta para ${content}`);
      return;
    }
    if (dryRun) {
      console.log(`  [dry-run] Cloudflare update ${name} → ${content}`);
      return;
    }
    const patchRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existing.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "CNAME", name, content, proxied: false, comment }),
      },
    );
    const patchData = await patchRes.json();
    if (!patchData.success) {
      throw new Error(`Cloudflare update ${name}: ${patchData.errors?.[0]?.message ?? "failed"}`);
    }
    console.log(`  ✓ Cloudflare: ${name} actualizado → ${content}`);
    return;
  }

  if (dryRun) {
    console.log(`  [dry-run] Cloudflare create ${name} → ${content}`);
    return;
  }

  const createRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "CNAME", name, content, proxied: false, comment }),
  });
  const createData = await createRes.json();
  if (!createData.success) {
    throw new Error(`Cloudflare create ${name}: ${createData.errors?.[0]?.message ?? "failed"}`);
  }
  console.log(`  ✓ Cloudflare: ${name} → ${content}`);
}

function printRegistroBrRows(rows) {
  console.log("\nRegistro.br (modo avançado) — adicionar entradas CNAME:\n");
  console.log("| Tipo  | Nome (FQDN completo)              | Dados (target Vercel)              |");
  console.log("| ----- | --------------------------------- | ---------------------------------- |");
  for (const row of rows) {
    console.log(`| CNAME | ${row.name.padEnd(33)} | ${row.target.padEnd(34)} |`);
  }
  console.log("\nO target é o mesmo para todas as vitrines / todos os painéis respectivamente.");
  console.log("Propagação: minutos a 48 h. Depois: https://{slug}." + PLATFORM_ROOT);
}

async function ensureCloudflareWildcards(storefrontTarget, panelTarget) {
  console.log("\nCloudflare — wildcards (uma vez por zona):\n");
  await ensureCloudflareCname({
    name: "*",
    content: storefrontTarget,
    comment: "AutoPainel vitrine multitenant (*.autopainel.com.br)",
  });
  await ensureCloudflareCname({
    name: "*.loja",
    content: panelTarget,
    comment: "AutoPainel painel loja multitenant (*.loja.autopainel.com.br)",
  });
}

async function main() {
  const effectiveSlugs =
    slugs.length > 0 ? slugs : wildcardsOnly ? ["demo"] : [];

  if (effectiveSlugs.length === 0) {
    usage();
    process.exit(1);
  }

  for (const slug of effectiveSlugs) {
    if (!SLUG_RE.test(slug)) {
      throw new Error(`Slug inválido: "${slug}" (use minúsculas, números e hífens)`);
    }
  }

  const token = resolveVercelToken();
  if (!token && !dryRun) {
    throw new Error("Sem VERCEL_TOKEN nem sessão vercel login. Execute: vercel login");
  }

  console.log(`Team: ${TEAM_SLUG}`);
  console.log(
    `Slugs: ${effectiveSlugs.join(", ")}${wildcardsOnly ? " (wildcards-only probe)" : ""}\n`,
  );

  const registroRows = [];
  let storefrontTarget = null;
  let panelTarget = null;

  for (const slug of effectiveSlugs) {
    const hosts = hostnamesForSlug(slug);
    console.log(`→ ${slug}`);

    await ensureProjectDomain(token, VERCEL_PROJECTS.storefront, hosts.storefront);
    await ensureProjectDomain(token, VERCEL_PROJECTS.panel, hosts.panel);

    if (!dryRun && token) {
      storefrontTarget = await fetchRecommendedCname(token, hosts.storefront);
      panelTarget = await fetchRecommendedCname(token, hosts.panel);

      registroRows.push({ name: hosts.storefront, target: storefrontTarget });
      registroRows.push({ name: hosts.panel, target: panelTarget });
    } else {
      registroRows.push({ name: hosts.storefront, target: "<vercel storefront cname>" });
      registroRows.push({ name: hosts.panel, target: "<vercel panel cname>" });
    }

    console.log(`  URLs: ${hosts.storefront} · ${hosts.panel}\n`);
  }

  if (useCloudflare && storefrontTarget && panelTarget) {
    await ensureCloudflareWildcards(storefrontTarget, panelTarget);
    if (!wildcardsOnly) {
      for (const slug of effectiveSlugs) {
        const hosts = hostnamesForSlug(slug);
        await ensureCloudflareCname({
          name: hosts.storefront.replace(`.${PLATFORM_ROOT}`, ""),
          content: storefrontTarget,
          comment: `AutoPainel vitrine ${slug}`,
        });
        await ensureCloudflareCname({
          name: hosts.panel.replace(`.${PLATFORM_ROOT}`, ""),
          content: panelTarget,
          comment: `AutoPainel painel ${slug}`,
        });
      }
    }
  } else if (!useCloudflare && storefrontTarget && panelTarget && !wildcardsOnly) {
    printRegistroBrRows(registroRows);
    console.log("\nEscala recomendada: migrar DNS para Cloudflare + wildcards (ver packages/shared/docs/DEALERSHIP_HOSTS_PROVISIONING.md).");
  }

  console.log("\nConcluído.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
