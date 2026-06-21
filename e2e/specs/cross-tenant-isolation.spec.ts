import { expect, test } from "@playwright/test";

import {
  loginDealershipPanel,
  resolveDealershipPanelPort,
  gotoAuthenticatedPanelPath,
} from "../helpers/dealership-panel-login";

const demoPassword = process.env.E2E_DEALERSHIP_PASSWORD?.trim() || "LojaDemo123!";

test.describe.configure({ mode: "serial" });

/**
 * Requires `dealership-panel` + Supabase with seed demo (`guiotti`, `autoprime`, `ecodrive`).
 */
test.describe("cross-tenant isolation — painel lojista", () => {
  test.beforeEach(({ page }) => {
    test.setTimeout(120_000);
  });

  test("estoque guiotti não expõe veículos da autoprime", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginDealershipPanel(page, {
      slug: "guiotti",
      email: "gestor.guiotti@autopainel.demo",
      password: demoPassword,
    });

    await gotoAuthenticatedPanelPath(page, "guiotti", "/painel/estoque");
    await expect(page.getByRole("heading", { name: /estoque/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ferrari/i }).first()).toBeVisible();
    await expect(page.getByText(/Camaro/i)).toHaveCount(0);

    await context.close();
  });

  test("estoque autoprime não expõe veículos da guiotti", async ({ browser }) => {
    const port = resolveDealershipPanelPort();
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginDealershipPanel(page, {
      slug: "autoprime",
      email: "gestor.autoprime@autopainel.demo",
      password: demoPassword,
    });

    await page.goto(`http://autoprime.localhost:${port}/painel/estoque`);
    await expect(page.getByRole("heading", { name: /estoque/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Camaro/i }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Ferrari F8/i)).toHaveCount(0);

    await context.close();
  });

  test("estoque ecodrive não expõe veículos da guiotti", async ({ browser }) => {
    const port = resolveDealershipPanelPort();
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginDealershipPanel(page, {
      slug: "ecodrive",
      email: "gestor.ecodrive@autopainel.demo",
      password: demoPassword,
    });

    await page.goto(`http://ecodrive.localhost:${port}/painel/estoque`);
    await expect(page.getByRole("link", { name: /BYD|Dolphin/i }).first()).toBeVisible();
    await expect(page.getByText(/Ferrari F8/i)).toHaveCount(0);

    await context.close();
  });

  test("nome da loja no shell reflete o tenant autenticado", async ({ browser }) => {
    test.setTimeout(180_000);
    const port = resolveDealershipPanelPort();

    const guiottiContext = await browser.newContext();
    const guiottiPage = await guiottiContext.newPage();
    await loginDealershipPanel(guiottiPage, {
      slug: "guiotti",
      email: "gestor.guiotti@autopainel.demo",
      password: demoPassword,
    });
    await guiottiPage.goto(`http://guiotti.localhost:${port}/painel`);
    await expect(
      guiottiPage.getByRole("banner").getByText("Guiotti Multimarcas").last(),
    ).toBeVisible();
    await guiottiContext.close();

    const autoprimeContext = await browser.newContext();
    const autoprimePage = await autoprimeContext.newPage();
    await loginDealershipPanel(autoprimePage, {
      slug: "autoprime",
      email: "gestor.autoprime@autopainel.demo",
      password: demoPassword,
    });
    await autoprimePage.goto(`http://autoprime.localhost:${port}/painel`);
    await expect(
      autoprimePage.getByRole("banner").getByText(/AutoPrime/i).last(),
    ).toBeVisible();
    await autoprimeContext.close();

    const ecodriveContext = await browser.newContext();
    const ecodrivePage = await ecodriveContext.newPage();
    await loginDealershipPanel(ecodrivePage, {
      slug: "ecodrive",
      email: "gestor.ecodrive@autopainel.demo",
      password: demoPassword,
    });
    await ecodrivePage.goto(`http://ecodrive.localhost:${port}/painel`);
    await expect(
      ecodrivePage.getByRole("banner").getByText(/EcoDrive/i).last(),
    ).toBeVisible();
    await ecodriveContext.close();
  });
});
