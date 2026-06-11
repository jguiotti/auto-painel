import { expect, test } from "@playwright/test";

import {
  loginDealershipPanel,
  resolveDealershipPanelPort,
} from "../helpers/dealership-panel-login";

test.describe("vehicle QR print — painel lojista", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("lâmina de QR carrega para veículo demo guiotti", async ({ page }) => {
    const port = resolveDealershipPanelPort();

    await loginDealershipPanel(page, { slug: "guiotti" });
    await page.goto(`http://guiotti.localhost:${port}/painel/estoque`);

    const vehicleLink = page.getByRole("link", { name: /Ferrari/i }).first();
    if ((await vehicleLink.count()) === 0) {
      test.skip(true, "Seed demo guiotti sem Ferrari — rode migrações/seed.");
    }

    await vehicleLink.click();
    await expect(page).toHaveURL(/\/painel\/estoque\/[^/]+$/);

    const qrLink = page.getByRole("link", { name: /Gerar QR Code/i });
    if ((await qrLink.count()) === 0) {
      test.skip(
        true,
        "Módulo qr_generator desabilitado para guiotti — habilite no plano/módulos.",
      );
    }

    await qrLink.click();
    await expect(page.getByRole("heading", { name: /QR Code/i })).toBeVisible();
    await expect(page.getByAltText(/QR Code para/i)).toBeVisible();
  });
});
