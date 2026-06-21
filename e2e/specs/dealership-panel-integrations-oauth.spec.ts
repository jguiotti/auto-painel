import { expect, test } from "@playwright/test";

import {
  loginDealershipPanel,
  postClassifiedsOAuthStart,
  resetStuckClassifiedsConnections,
  resolveDemoDealershipCredentials,
  dismissDealershipPanelOverlays,
  gotoAuthenticatedPanelPath,
} from "../helpers/dealership-panel-login";

const { slug } = resolveDemoDealershipCredentials();
const devStubEnabled = process.env.CLASSIFIEDS_OAUTH_DEV_STUB?.trim().toLowerCase();

test.describe("dealership-panel — integrações OAuth autenticado", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await resetStuckClassifiedsConnections(slug);
    await loginDealershipPanel(page, { slug });
  });

  test("página de integrações carrega para loja enterprise", async ({ page }) => {
    await gotoAuthenticatedPanelPath(page, slug, "/painel/integracoes");
    await expect(page.getByRole("heading", { name: /integrações/i })).toBeVisible();
    await expect(page.locator('[data-provider="olx"]').first()).toBeVisible();
    await expect(page.locator('[data-provider="webmotors"]').first()).toBeVisible();
    await expect(page.locator('[data-provider="icarros"]').first()).toBeVisible();
  });

  test("UI conecta OLX via dev stub quando habilitado", async ({ page, context }) => {
    test.skip(
      devStubEnabled !== "true" && devStubEnabled !== "1",
      "Requer CLASSIFIEDS_OAUTH_DEV_STUB=true no .env.local",
    );

    await gotoAuthenticatedPanelPath(page, slug, "/painel/integracoes");

    const olxCard = page.locator('[data-provider="olx"]');
    await olxCard.getByRole("button", { name: /^Conectar$|^Conectar novamente$/ }).click();

    const popupPromise = context.waitForEvent("page");
    await page.getByRole("button", { name: /continuar para login/i }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded");
    await expect(popup).toHaveURL(/oauth\/dev\/authorize/);

    await popup.locator("a.button").click();
    await popup.waitForEvent("close", { timeout: 15000 }).catch(() => undefined);

    await expect(olxCard.getByText("Conectado")).toBeVisible({ timeout: 20000 });
  });

  test("OLX inicia OAuth (dev stub, OLX real ou 503 sem credenciais)", async ({ page }) => {
    const result = await postClassifiedsOAuthStart(page, "olx");

    if (devStubEnabled === "true" || devStubEnabled === "1") {
      expect(result.status).toBe(200);
      expect(result.body.authorizationUrl).toMatch(/oauth\/dev\/authorize/);
      return;
    }

    if (result.status === 200 && result.body.authorizationUrl) {
      expect(result.body.authorizationUrl).toMatch(/auth\.olx\.com\.br/);
      return;
    }

    expect(result.status).toBe(503);
    expect(["oauth_not_configured", "oauth_session_store_mismatch"]).toContain(
      result.body.code,
    );
  });

  test("WebMotors inicia OAuth (dev stub ou 503 sem credenciais)", async ({ page }) => {
    await gotoAuthenticatedPanelPath(page, slug, "/painel/integracoes");

    const result = await postClassifiedsOAuthStart(page, "webmotors");

    if (devStubEnabled === "true" || devStubEnabled === "1") {
      expect(result.status).toBe(200);
      expect(result.body.authorizationUrl).toMatch(/oauth\/dev\/authorize/);
      return;
    }

    expect(result.status).toBe(503);
    expect(["oauth_not_configured", "oauth_session_store_mismatch"]).toContain(
      result.body.code,
    );
  });

  test("centro de notificações abre em sheet lateral", async ({ page }) => {
    await gotoAuthenticatedPanelPath(page, slug, "/painel");

    await page.getByRole("button", { name: /notificações/i }).click();
    await expect(page.getByRole("dialog", { name: "Novidades da loja" })).toBeVisible();
  });
});
