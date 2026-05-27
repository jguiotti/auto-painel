import { expect, test } from "@playwright/test";

import {
  loginDealershipPanel,
  postClassifiedsOAuthStart,
  resolveDemoDealershipCredentials,
} from "../helpers/dealership-panel-login";

const { slug } = resolveDemoDealershipCredentials();
const panelPort = process.env.E2E_DEALERSHIP_PANEL_PORT ?? "3002";

test.describe("dealership-panel — integrações OAuth autenticado", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await loginDealershipPanel(page, { slug });
  });

  test("página de integrações carrega para loja enterprise", async ({ page }) => {
    await page.goto(`http://${slug}.localhost:${panelPort}/painel/integracoes`);
    await expect(page.getByRole("heading", { name: /integrações/i })).toBeVisible();
    await expect(page.getByText("OLX", { exact: true })).toBeVisible();
    await expect(page.getByText("WebMotors", { exact: true })).toBeVisible();
  });

  test("OLX retorna 503 oauth_not_configured sem credenciais de ambiente", async ({
    page,
  }) => {
    const result = await postClassifiedsOAuthStart(page, "olx");

    expect(result.status).toBe(503);
    expect(result.body.code).toBe("oauth_not_configured");
    expect(result.body.error).toMatch(/ainda não está disponível/i);
  });

  test("WebMotors retorna 503 oauth_not_configured sem credenciais de ambiente", async ({
    page,
  }) => {
    const result = await postClassifiedsOAuthStart(page, "webmotors");

    expect(result.status).toBe(503);
    expect(result.body.code).toBe("oauth_not_configured");
    expect(result.body.error).toMatch(/ainda não está disponível/i);
  });

  test("UI exibe diálogo amigável ao conectar OLX sem canal disponível", async ({
    page,
  }) => {
    await page.goto(`http://${slug}.localhost:${panelPort}/painel/integracoes`);

    const connectButton = page
      .getByRole("button", { name: /^Conectar$|^Conectar novamente$/ })
      .first();
    await connectButton.click();

    await expect(page.getByRole("alertdialog")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/canal indisponível/i)).toBeVisible();
    await expect(page.getByText(/fale com nosso suporte/i)).toBeVisible();
  });

  test("centro de notificações abre em sheet lateral", async ({ page }) => {
    await page.goto(`http://${slug}.localhost:${panelPort}/painel`);

    await page.getByRole("button", { name: /notificações/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Novidades da loja")).toBeVisible();
  });
});
