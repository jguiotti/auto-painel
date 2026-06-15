import { expect, test } from "@playwright/test";

import {
  loginDealershipPanelOrSkip,
  resolveDealershipPanelPort,
} from "../helpers/dealership-panel-login";
import {
  clickStorefrontContatoNav,
  gotoStorefront,
  resolveActiveStorefrontSlug,
  skipIfStorefrontTenantUnavailable,
} from "../helpers/storefront-tenant";

const panelPort = resolveDealershipPanelPort();
const demoPassword = process.env.E2E_DEALERSHIP_PASSWORD?.trim() || "LojaDemo123!";
const storefrontSlug = resolveActiveStorefrontSlug();

test.describe.configure({ mode: "serial" });

async function acceptStorefrontCookiesIfVisible(page: import("@playwright/test").Page) {
  const acceptButton = page.getByRole("button", { name: "Aceitar todos" });
  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click();
  }
}

/** Next.js injects an empty `#__next-route-announcer__` with role=alert — avoid that locator. */
async function expectPrivacyConsentBlocked(page: import("@playwright/test").Page) {
  await expect(page.getByText("Recebemos seu contato")).toHaveCount(0);
  const privacyValid = await page
    .locator("#privacy_consent")
    .evaluate((el: HTMLInputElement) => el.validity.valid);
  expect(privacyValid).toBe(false);
}

test.describe("CRM Fase A — vitrine /contato", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("header expõe link Contato que carrega a página", async ({ page }) => {
    const slug = await gotoStorefront(page, "/");
    await skipIfStorefrontTenantUnavailable(page, slug);
    await acceptStorefrontCookiesIfVisible(page);

    await clickStorefrontContatoNav(page);

    await expect(page).toHaveURL(/\/contato$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Fale com a/i);
    await expect(page.getByRole("heading", { name: "Unidades" })).toHaveCount(0);
  });

  test("CA-CRM-A1: formulário /contato exige aceite de privacidade", async ({ page }) => {
    const slug = await gotoStorefront(page, "/contato");
    await skipIfStorefrontTenantUnavailable(page, slug);
    await acceptStorefrontCookiesIfVisible(page);

    await page.locator("#contact-name").fill("Visitante QA");
    await page.locator("#contact-phone").fill("5511999887766");
    await page.getByRole("button", { name: "Enviar mensagem" }).click();

    await expectPrivacyConsentBlocked(page);
  });

  test("CA-CRM-A2: formulário /contato válido confirma envio", async ({ page }) => {
    const uniqueName = `E2E Contato ${Date.now()}`;

    const slug = await gotoStorefront(page, "/contato");
    await skipIfStorefrontTenantUnavailable(page, slug);
    await acceptStorefrontCookiesIfVisible(page);

    await page.locator("#contact-name").fill(uniqueName);
    await page.locator("#contact-phone").fill("5511999887766");
    await page.locator("#privacy_consent").check();
    await page.getByRole("button", { name: "Enviar mensagem" }).click();

    await expect(page.getByText("Recebemos seu contato. Em breve nossa equipe retorna.")).toBeVisible();
  });
});

test.describe("CRM Fase B — painel contatos", () => {
  test("CA-CRM-A4: gestor vê inbox com leads demo e origem", async ({ page }) => {
    await loginDealershipPanelOrSkip(page, {
      slug: "guiotti",
      email: "gestor.guiotti@autopainel.demo",
      password: demoPassword,
    });

    await page.goto(`http://guiotti.localhost:${panelPort}/painel/contatos`);
    await expect(page.getByRole("heading", { name: "Contatos" })).toBeVisible();

    const leadsTable = page.getByRole("table");
    await expect(leadsTable.getByRole("cell", { name: "Carlos Mendes" })).toBeVisible();
    await expect(leadsTable.getByText("Página de contato").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Novo contato" })).toBeVisible();
  });

  test("cross-tenant: contatos guiotti não listam lead da autoprime", async ({ page }) => {
    await loginDealershipPanelOrSkip(page, {
      slug: "guiotti",
      email: "gestor.guiotti@autopainel.demo",
      password: demoPassword,
    });

    await page.goto(`http://guiotti.localhost:${panelPort}/painel/contatos`);
    await expect(page.getByText("Diego Alves")).toHaveCount(0);
  });
});

test.describe("CRM Fases C/D — loja e equipe", () => {
  test("CA-CRM-C1: gestor acessa /painel/loja", async ({ page }) => {
    await loginDealershipPanelOrSkip(page, {
      slug: "guiotti",
      email: "gestor.guiotti@autopainel.demo",
      password: demoPassword,
    });

    await page.goto(`http://guiotti.localhost:${panelPort}/painel/loja`);
    await expect(page.getByRole("heading", { name: /Dados da loja/i })).toBeVisible();
  });

  test("CA-CRM-D1: gestor acessa /painel/equipe", async ({ page }) => {
    await loginDealershipPanelOrSkip(page, {
      slug: "guiotti",
      email: "gestor.guiotti@autopainel.demo",
      password: demoPassword,
    });

    await page.goto(`http://guiotti.localhost:${panelPort}/painel/equipe`);
    await expect(page.getByRole("heading", { name: /Equipe/i })).toBeVisible();
  });
});

test.describe("CRM — simulação financiamento (guiotti enterprise)", () => {
  test("lead de simulação na ficha do veículo aparece no painel", async ({ page, browser }) => {
    const uniqueName = `E2E Sim ${Date.now()}`;

    const slug = await gotoStorefront(page, "/veiculo/demo-ferrari-f8", "guiotti");
    await skipIfStorefrontTenantUnavailable(page, slug);
    await acceptStorefrontCookiesIfVisible(page);

    await expect(page.getByText("Garanta sua proposta de financiamento")).toBeVisible();

    await page.locator("#lead-name").fill(uniqueName);
    await page.locator("#lead-phone").fill("5511988776655");
    await page.locator("#privacy_consent").check();
    await page.getByRole("button", { name: "Quero minha proposta agora" }).click();

    await expect(
      page.getByText("Perfeito! Nossa equipe vai entrar em contato em breve"),
    ).toBeVisible({ timeout: 15_000 });

    const panelContext = await browser.newContext();
    const panelPage = await panelContext.newPage();
    await loginDealershipPanelOrSkip(panelPage, {
      slug: "guiotti",
      email: "gestor.guiotti@autopainel.demo",
      password: demoPassword,
    });
    await panelPage.goto(`http://guiotti.localhost:${panelPort}/painel/contatos`);
    await expect(
      panelPage.getByRole("cell", { name: uniqueName }),
    ).toBeVisible({ timeout: 15_000 });
    await panelContext.close();
  });
});

test.describe("CRM — gating plano demo", () => {
  test("ecodrive starter não exibe geração de QR na ficha do veículo", async ({ page }) => {
    await loginDealershipPanelOrSkip(page, {
      slug: "ecodrive",
      email: "gestor.ecodrive@autopainel.demo",
      password: demoPassword,
    });

    await page.goto(`http://ecodrive.localhost:${panelPort}/painel/estoque`);

    const vehicleLink = page.getByRole("link").filter({ hasText: /BYD|Dolphin/i }).first();
    if ((await vehicleLink.count()) === 0) {
      test.skip(true, "Seed ecodrive sem veículo demo visível.");
    }

    await vehicleLink.click();
    await expect(page.getByRole("link", { name: "Gerar QR Code" })).toHaveCount(0);
  });

  test("autoprime business exibe geração de QR na ficha do veículo", async ({ page }) => {
    await loginDealershipPanelOrSkip(page, {
      slug: "autoprime",
      email: "gestor.autoprime@autopainel.demo",
      password: demoPassword,
    });

    await page.goto(`http://autoprime.localhost:${panelPort}/painel/estoque`);

    const vehicleLink = page.getByRole("link").filter({ hasText: /Camaro/i }).first();
    if ((await vehicleLink.count()) === 0) {
      test.skip(true, "Seed autoprime sem veículo demo visível.");
    }

    await vehicleLink.click();
    await expect(page.getByRole("link", { name: "Gerar QR Code" })).toBeVisible();
  });
});
