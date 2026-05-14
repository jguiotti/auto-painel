import { expect, test } from "@playwright/test";

const adminPort = process.env.E2E_ADMIN_MASTER_PORT ?? "3001";
const panelPort = process.env.E2E_DEALERSHIP_PANEL_PORT ?? "3002";
const storefrontPort = process.env.E2E_CUSTOMER_SITE_PORT ?? "3003";
const marketingPort = process.env.E2E_MARKETING_SITE_PORT ?? "3004";

const panelSlug = process.env.E2E_DEALERSHIP_SLUG?.trim();

test.describe("visual layout smoke", () => {
  const routes: Array<{ name: string; url: string }> = [
    { name: "admin login", url: `http://127.0.0.1:${adminPort}/login` },
    { name: "admin root", url: `http://127.0.0.1:${adminPort}/` },
    { name: "panel login", url: `http://127.0.0.1:${panelPort}/login` },
    { name: "panel tenant error", url: `http://127.0.0.1:${panelPort}/erro/concessionaria` },
    { name: "storefront tenant error", url: `http://127.0.0.1:${storefrontPort}/erro/concessionaria` },
    { name: "marketing home", url: `http://127.0.0.1:${marketingPort}/` },
    { name: "marketing contato", url: `http://127.0.0.1:${marketingPort}/contato` },
    { name: "marketing funcionalidades", url: `http://127.0.0.1:${marketingPort}/funcionalidades` },
  ];

  if (panelSlug) {
    routes.push({
      name: "storefront home tenant",
      url: `http://${panelSlug}.localhost:${storefrontPort}/`,
    });
    routes.push({
      name: "panel public home tenant",
      url: `http://${panelSlug}.localhost:${panelPort}/`,
    });
  }

  for (const route of routes) {
    test(`${route.name} has no horizontal overflow`, async ({ page }) => {
      try {
        await page.goto(route.url);
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes("ERR_CONNECTION_REFUSED") ||
            error.message.includes("ERR_CONNECTION_TIMED_OUT"))
        ) {
          test.skip(true, `Servidor indisponível para rota visual: ${route.url}`);
        }
        throw error;
      }
      await page.waitForLoadState("domcontentloaded");
      const layout = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        htmlScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
      }));
      expect(layout.htmlScrollWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
      expect(layout.bodyScrollWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
    });
  }
});
