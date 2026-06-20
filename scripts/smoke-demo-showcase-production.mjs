/**
 * Production smoke for showcase demo vitrines + panel login pages.
 * Usage: node scripts/smoke-demo-showcase-production.mjs
 */
const DEMOS = ["demo", "demo-2", "demo-3"];

const checks = [];

for (const slug of DEMOS) {
  checks.push(
    { url: `https://${slug}.autopainel.com.br`, expect: 200, label: `vitrine ${slug}` },
    {
      url: `https://${slug}.loja.autopainel.com.br/login`,
      expect: 200,
      label: `painel login ${slug}`,
    },
  );
}

let failed = 0;

for (const { url, expect, label } of checks) {
  const response = await fetch(url, { redirect: "follow" });
  const ok = response.status === expect;
  console.log(`${ok ? "OK" : "FAIL"} [${response.status}] ${label} — ${url}`);
  if (!ok) {
    failed += 1;
  }
}

console.log(
  failed === 0
    ? `\n${checks.length}/${checks.length} checks passed.`
    : `\n${checks.length - failed}/${checks.length} passed; ${failed} failed.`,
);
console.log(
  "Login manual: gestor.demo@autopainel.demo / LojaDemo123! em cada painel demo.",
);

process.exit(failed === 0 ? 0 : 1);
