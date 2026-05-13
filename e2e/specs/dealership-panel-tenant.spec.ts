import { expect, test } from "@playwright/test";

const panelPort = process.env.E2E_DEALERSHIP_PANEL_PORT ?? "3002";
const bareOrigin = `http://127.0.0.1:${panelPort}`;

test.describe.configure({ mode: "serial" });

/**
 * Requires `dealership-panel` running with valid Supabase env (e.g. `npm run dev:all`).
 */
test.describe("dealership-panel tenant routing", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("dealership erro page is reachable for copy and support", async ({ page }) => {
    await page.goto(`${bareOrigin}/erro/concessionaria`);
    await expect(
      page.getByRole("heading", {
        name: /Concessionária não encontrada neste domínio/i,
      }),
    ).toBeVisible();
  });

  test("missing subdomain slug → erro de tenant (painel)", async ({ page }) => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const fakeSlug = `e2e-absent-${suffix}`;
    await page.goto(`http://${fakeSlug}.localhost:${panelPort}/`);
    await expect(page).toHaveURL(/\/erro\/concessionaria/);
    await expect(
      page.getByRole("heading", {
        name: /Concessionária não encontrada neste domínio/i,
      }),
    ).toBeVisible();
  });

  test("existing slug resolves tenant → login em /painel (sessão obrigatória)", async ({
    page,
  }) => {
    const slug = process.env.E2E_DEALERSHIP_SLUG?.trim();
    test.skip(
      !slug,
      "Define E2E_DEALERSHIP_SLUG no .env.local com uma concessionária active para validar o fluxo feliz.",
    );

    await page.goto(`http://${slug}.localhost:${panelPort}/painel`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /^Entrar$/ })).toBeVisible();
  });
});
