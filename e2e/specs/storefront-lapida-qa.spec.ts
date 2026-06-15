import { expect, test } from "@playwright/test";

import {
  loginDealershipPanel,
  postClassifiedsOAuthStart,
  resolveDemoDealershipCredentials,
} from "../helpers/dealership-panel-login";

const storefrontPort = process.env.E2E_CUSTOMER_SITE_PORT ?? "3003";
const demoSlug = resolveDemoDealershipCredentials().slug;

test.describe("storefront lapidação — WhatsApp, filtros e header mobile", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("header expõe link Contato válido (BZ-CRM-006)", async ({ page }) => {
    const brokenContato: string[] = [];
    page.on("response", (response) => {
      if (response.url().includes("/contato") && response.status() === 404) {
        brokenContato.push(response.url());
      }
    });

    await page.goto(`http://${demoSlug}.localhost:${storefrontPort}/`);
    await expect(page.locator("body")).toBeVisible();

    const contatoLink = page.getByRole("link", { name: "Contato" });
    await expect(contatoLink).toBeVisible();
    await contatoLink.click();
    await expect(page).toHaveURL(/\/contato$/);
    expect(brokenContato).toEqual([]);
  });

  test("CTA test drive abre WhatsApp com UTM de campanha", async ({ page }) => {
    await page.goto(`http://${demoSlug}.localhost:${storefrontPort}/`);

    const whatsappCta = page.getByRole("link", {
      name: /agendar test drive/i,
    });
    if ((await whatsappCta.count()) === 0) {
      test.skip(true, "Loja demo sem whatsapp_number — configure no seed.");
    }

    const href = await whatsappCta.first().getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toMatch(/^https:\/\/wa\.me\//);
    expect(href).toContain("utm_source=vitrine");
    expect(href).toContain("utm_medium=whatsapp");
    expect(href).toContain("utm_campaign=test_drive");
    expect(href).toContain(`utm_content=${demoSlug}`);
    expect(href).toContain("text=");
  });

  test("filtro por tipo de veículo aparece quando há tipos no estoque", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`http://${demoSlug}.localhost:${storefrontPort}/estoque`);

    const typeFilter = page.getByLabel("Tipo de veículo").locator("visible=true").first();
    await expect(typeFilter).toBeVisible();

    await typeFilter.click();
    await expect(page.getByRole("option", { name: "Motocicleta" })).toBeVisible();
    await page.getByRole("option", { name: "Motocicleta" }).click();
    await page.getByRole("button", { name: "Ver veículos" }).first().click();

    await expect(page).toHaveURL(/\/estoque\?vehicleType=motocicleta/);
    await expect(page.locator("body")).toContainText(/ducati|harley|bmw/i);
  });

  test("header mobile expõe menu colapsável", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`http://${demoSlug}.localhost:${storefrontPort}/`);

    const menuButton = page.getByRole("button", { name: "Menu" });
    await expect(menuButton).toBeVisible();

    await menuButton.click();
    await expect(page.locator("#storefront-mobile-menu").getByRole("link", { name: "Estoque" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Fechar" })).toBeVisible();
  });
});

test.describe("painel — integrações OAuth demo", () => {
  test("OLX retorna 503 amigável sem credenciais OAuth (autenticado)", async ({
    page,
  }) => {
    await loginDealershipPanel(page, { slug: demoSlug });
    const result = await postClassifiedsOAuthStart(page, "olx");

    expect(result.status).toBe(503);
    expect(result.body.code).toBe("oauth_not_configured");
    expect(result.body.error).toMatch(/indisponível/i);
  });
});
