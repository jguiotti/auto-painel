import { expect, test } from "@playwright/test";

import {
  gotoAdminMasterOrSkip,
  loginAdminMasterOrSkip,
  loginSalesRepOrSkip,
  resolveAdminMasterPort,
  skipIfAdminMasterUnavailable,
} from "../helpers/admin-master-login";

const adminPort = resolveAdminMasterPort();
const adminBase = `http://127.0.0.1:${adminPort}`;

test.describe("platform sales squad — auth gates", () => {
  test("rotas protegidas redirecionam para login sem sessão", async ({ page }) => {
    await gotoAdminMasterOrSkip(page, "/painel/equipe/comercial");
    await expect(page).toHaveURL(/\/login/);

    await gotoAdminMasterOrSkip(page, "/painel/comercial/extrato");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("platform sales squad — admin UI", () => {
  test("super_admin acessa lista de representantes comerciais", async ({ page }) => {
    await loginAdminMasterOrSkip(page);
    await page.goto(`${adminBase}/painel/equipe/comercial`);
    await expect(page.getByRole("heading", { name: "Equipe comercial" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Novo representante" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("super_admin abre formulário de novo representante", async ({ page }) => {
    await loginAdminMasterOrSkip(page);
    await page.goto(`${adminBase}/painel/equipe/comercial/novo`);
    await expect(page.getByText("Novo representante comercial")).toBeVisible();
    await expect(page.getByLabel("Nome completo")).toBeVisible();
  });
});

test.describe("platform sales squad — rep portal", () => {
  test("rep autenticado cai em Meu extrato após login", async ({ page }) => {
    await loginSalesRepOrSkip(page, "a");
    await expect(page.getByRole("heading", { name: "Meu extrato" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Portal comercial" }).getByRole("link", {
        name: "Minha carteira",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Portal comercial" }).getByRole("link", {
        name: "Dados de pagamento",
      }),
    ).toBeVisible();
  });

  test("rep não acessa painel admin — redireciona para extrato", async ({ page }) => {
    await loginSalesRepOrSkip(page, "a");
    await page.goto(`${adminBase}/painel/dashboard`);
    await expect(page).toHaveURL(/\/painel\/comercial\/extrato/);
  });

  test("rep navega para dados de pagamento", async ({ page }) => {
    await loginSalesRepOrSkip(page, "a");
    await page
      .getByRole("navigation", { name: "Portal comercial" })
      .getByRole("link", { name: "Dados de pagamento" })
      .click();
    await expect(page).toHaveURL(/\/painel\/comercial\/dados-pagamento/);
    await expect(page.getByRole("heading", { name: "Dados de pagamento" })).toBeVisible();
  });
});

test.describe("platform sales squad — dealership user blocked", () => {
  test("gestor de loja não entra no admin-master", async ({ page }) => {
    const panelPort = process.env.E2E_DEALERSHIP_PANEL_PORT ?? "3002";
    const email =
      process.env.E2E_DEALERSHIP_EMAIL?.trim() ||
      "gestor.guiotti@autopainel.demo";
    const password = process.env.E2E_DEALERSHIP_PASSWORD?.trim() || "LojaDemo123!";

    try {
      await page.goto(`http://127.0.0.1:${adminPort}/login`);
    } catch (error) {
      skipIfAdminMasterUnavailable(error);
      throw error;
    }
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
    await expect(page.getByText(/não tem permissão/i)).toBeVisible();

    // Sanity: same creds still work on dealership panel (when dev server is up)
    try {
      await page.goto(`http://guiotti.localhost:${panelPort}/login`);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("ERR_CONNECTION_REFUSED")
      ) {
        test.skip(true, "dealership-panel não está rodando na porta configurada");
      }
      throw error;
    }
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/painel/);
  });
});
