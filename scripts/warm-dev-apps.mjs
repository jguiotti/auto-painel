/**
 * Pre-compiles Next.js dev routes so the browser does not sit on a blank tab
 * for 1–2 minutes on first access (Tailwind v4 + monorepo).
 *
 * Run while `npm run dev:all` or `npm run dev:lite` is up (separate terminal).
 */
const URLS = process.argv.includes("--lite")
  ? [
      { label: "admin login", url: "http://127.0.0.1:3001/login" },
      { label: "painel login", url: "http://127.0.0.1:3002/login" },
      {
        label: "vitrine guiotti",
        url: "http://127.0.0.1:3003/",
        host: "guiotti.localhost:3003",
      },
    ]
  : [
  { label: "marketing", url: "http://127.0.0.1:3000/" },
  { label: "admin login", url: "http://127.0.0.1:3001/login" },
  { label: "painel login", url: "http://127.0.0.1:3002/login" },
  {
    label: "vitrine guiotti",
    url: "http://127.0.0.1:3003/",
    host: "guiotti.localhost:3003",
  },
];

const TIMEOUT_MS = 180_000;

async function warmOne({ label, url, host }) {
  const started = Date.now();
  process.stdout.write(`→ ${label} (${host ?? url})… `);

  try {
    const response = await fetch(url, {
      headers: host ? { Host: host } : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`${response.status} em ${elapsed}s`);
  } catch (error) {
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`falhou após ${elapsed}s — ${error instanceof Error ? error.message : error}`);
  }
}

for (const entry of URLS) {
  await warmOne(entry);
}

console.log("\nPronto. Abra no navegador; recarregos seguintes devem ser rápidos.");
