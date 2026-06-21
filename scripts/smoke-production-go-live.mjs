/**
 * Production go-live smoke (Épico 3 — Onda A).
 * Usage: npm run smoke:production-go-live
 */
const PLATFORM_ROOT = "autopainel.com.br";
const PANEL_ROOT = `loja.${PLATFORM_ROOT}`;
const DEMOS = ["demo", "demo-2", "demo-3"];

const hardChecks = [
  { url: `https://${PLATFORM_ROOT}`, expect: 200, label: "marketing apex" },
  { url: `https://admin.${PLATFORM_ROOT}/login`, expect: 200, label: "admin login" },
  { url: `https://guiotti.${PLATFORM_ROOT}`, expect: 200, label: "vitrine guiotti" },
  { url: `https://guiotti.${PANEL_ROOT}/painel`, expect: [200, 307, 308], label: "painel guiotti" },
  {
    url: `https://guiotti.${PANEL_ROOT}/painel/integracoes`,
    expect: [200, 307, 308],
    label: "hub integrações guiotti",
  },
];

/** Known operational gaps — warn only (wave A §3: www DNS/TLS). */
const softChecks = [
  { url: `https://www.${PLATFORM_ROOT}`, expect: 200, label: "marketing www (redirect)" },
];

for (const slug of DEMOS) {
  hardChecks.push(
    { url: `https://${slug}.${PLATFORM_ROOT}`, expect: 200, label: `vitrine ${slug}` },
    {
      url: `https://${slug}.${PANEL_ROOT}/login`,
      expect: 200,
      label: `painel login ${slug}`,
    },
  );
}

function statusOk(status, expect) {
  if (Array.isArray(expect)) {
    return expect.includes(status);
  }
  return status === expect;
}

let failed = 0;
let warned = 0;

async function runCheck({ url, expect, label }, soft = false) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    const ok = statusOk(response.status, expect);
    const prefix = ok ? "OK" : soft ? "WARN" : "FAIL";
    console.log(`${prefix} [${response.status}] ${label} — ${url}`);
    if (!ok) {
      if (soft) {
        warned += 1;
      } else {
        failed += 1;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const prefix = soft ? "WARN" : "FAIL";
    console.log(`${prefix} [ERR] ${label} — ${url} (${message})`);
    if (soft) {
      warned += 1;
    } else {
      failed += 1;
    }
  }
}

for (const check of hardChecks) {
  await runCheck(check, false);
}

for (const check of softChecks) {
  await runCheck(check, true);
}

const totalHard = hardChecks.length;
console.log(
  failed === 0
    ? `\n${totalHard}/${totalHard} hard checks passed.${warned > 0 ? ` ${warned} soft warning(s).` : ""}`
    : `\n${totalHard - failed}/${totalHard} hard checks passed; ${failed} failed.${warned > 0 ? ` ${warned} soft warning(s).` : ""}`,
);
console.log(
  "Login demo manual: gestor.demo@autopainel.demo / LojaDemo123! em demo*.loja.autopainel.com.br",
);
console.log("E2E produção opcional: E2E_PRODUCTION=true npm run test:e2e -- e2e/specs/production-go-live.spec.ts");

process.exit(failed === 0 ? 0 : 1);
