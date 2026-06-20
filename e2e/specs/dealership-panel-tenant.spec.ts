import { expect, test } from "@playwright/test";

import { TENANT_ERROR_HEADING_RE } from "../helpers/tenant-error-page";

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
        name: TENANT_ERROR_HEADING_RE,
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
        name: TENANT_ERROR_HEADING_RE,
      }),
    ).toBeVisible();
  });

  test("error page: single h1 and hero without 404 wording", async ({ page }) => {
    await page.goto(`${bareOrigin}/erro/concessionaria`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(TENANT_ERROR_HEADING_RE);
    await expect(h1).not.toContainText(/404/i);
  });

  test("dev technical disclosure exists and starts collapsed", async ({ page }) => {
    await page.goto(`${bareOrigin}/erro/concessionaria`);
    const details = page.locator("details");
    if ((await details.count()) === 0) {
      test.skip(true, "Checklist técnica só em NODE_ENV=development (ex.: next dev).");
    }
    await expect(details).not.toHaveAttribute("open");
    await expect(page.getByText("Detalhes para a equipe técnica")).toBeVisible();
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
    await expect(page.getByRole("heading", { name: /Entrar no painel/i })).toBeVisible();
  });

  test("dealership-panel keeps light background on auth boundary", async ({
    page,
  }) => {
    const slug = process.env.E2E_DEALERSHIP_SLUG?.trim();
    test.skip(!slug, "Define E2E_DEALERSHIP_SLUG no .env.local.");

    await page.goto(`http://${slug}.localhost:${panelPort}/painel`);
    await expect(page).toHaveURL(/\/login/);

    const bodyBackground = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      return styles.backgroundColor;
    });
    // Auth shell uses light surface; allow off-white / theme token, reject obvious dark shells.
    expect(bodyBackground).not.toMatch(/rgb\(1[0-5],/);
  });

  test("existing slug resolves tenant on root (não cai em /erro/concessionaria)", async ({
    page,
  }) => {
    const slug = process.env.E2E_DEALERSHIP_SLUG?.trim();
    test.skip(
      !slug,
      "Define E2E_DEALERSHIP_SLUG no .env.local com uma concessionária para validar o host canônico.",
    );

    await page.goto(`http://${slug}.localhost:${panelPort}/`);
    await expect(page).not.toHaveURL(/\/erro\/concessionaria/);
    await expect(
      page.getByRole("heading", {
        name: TENANT_ERROR_HEADING_RE,
      }),
    ).toHaveCount(0);
  });
});
