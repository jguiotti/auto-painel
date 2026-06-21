import { expect, test } from "@playwright/test";

import {
  dismissDealershipPanelOverlays,
} from "../helpers/dealership-panel-login";

const PLATFORM_ROOT = process.env.E2E_PLATFORM_ROOT_DOMAIN?.trim() || "autopainel.com.br";
const PANEL_ROOT = process.env.E2E_PANEL_ROOT_DOMAIN?.trim() || `loja.${PLATFORM_ROOT}`;

const demoEmail =
  process.env.E2E_DEMO_SHOWCASE_EMAIL?.trim() || "gestor.demo@autopainel.demo";
const demoPassword = process.env.E2E_DEALERSHIP_PASSWORD?.trim() || "LojaDemo123!";

function panelOrigin(slug: string): string {
  return `https://${slug}.${PANEL_ROOT}`;
}

function storefrontOrigin(slug: string): string {
  return `https://${slug}.${PLATFORM_ROOT}`;
}

test.describe("production go-live — Épico 3", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    if (process.env.E2E_PRODUCTION?.trim().toLowerCase() !== "true") {
      testInfo.skip(
        true,
        "Defina E2E_PRODUCTION=true para executar smoke de login em produção.",
      );
    }
  });

  test("demo vitrine e login painel showcase", async ({ browser }) => {
    test.setTimeout(120_000);

    const slug = process.env.E2E_DEMO_SHOWCASE_SLUG?.trim() || "demo";
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${storefrontOrigin(slug)}/estoque`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByRole("heading", { name: /estoque/i })).toBeVisible({
      timeout: 30_000,
    });

    await context.addCookies([
      {
        name: "ap_panel_onboarding_v1",
        value: "1",
        url: panelOrigin(slug),
      },
    ]);
    await page.goto(`${panelOrigin(slug)}/login`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByRole("heading", { name: "Entrar no painel" })).toBeVisible();
    await page.locator("#email").fill(demoEmail);
    await page.locator("#password").fill(demoPassword);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/painel(\?|$)/, { timeout: 45_000 });
    await dismissDealershipPanelOverlays(page);
    await expect(page.getByRole("link", { name: /estoque/i }).first()).toBeVisible();

    await context.close();
  });
});
