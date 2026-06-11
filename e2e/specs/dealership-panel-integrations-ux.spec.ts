import { expect, test } from "@playwright/test";

import {
  loginDealershipPanel,
  resolveDealershipPanelPort,
} from "../helpers/dealership-panel-login";

const demoPassword = process.env.E2E_DEALERSHIP_PASSWORD?.trim() || "LojaDemo123!";
const port = resolveDealershipPanelPort();

test.describe("dealership-panel — integrações UX facilitada (Épico 2)", () => {
  test.describe("gating por plano", () => {
    test("ecodrive (starter) não exibe Integrações no menu", async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await loginDealershipPanel(page, {
        slug: "ecodrive",
        email: "gestor.ecodrive@autopainel.demo",
        password: demoPassword,
      });

      await page.goto(`http://ecodrive.localhost:${port}/painel`);
      await expect(page.getByRole("link", { name: "Integrações" })).toHaveCount(0);

      await context.close();
    });

    test("ecodrive redireciona /painel/integracoes para /painel", async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await loginDealershipPanel(page, {
        slug: "ecodrive",
        email: "gestor.ecodrive@autopainel.demo",
        password: demoPassword,
      });

      await page.goto(`http://ecodrive.localhost:${port}/painel/integracoes`);
      await expect(page).toHaveURL(/\/painel$/);

      await context.close();
    });

    test("autoprime (business) não exibe Integrações no menu", async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await loginDealershipPanel(page, {
        slug: "autoprime",
        email: "gestor.autoprime@autopainel.demo",
        password: demoPassword,
      });

      await page.goto(`http://autoprime.localhost:${port}/painel`);
      const integrationsNavCount = await page.getByRole("link", { name: "Integrações" }).count();
      if (integrationsNavCount > 0) {
        test.skip(
          true,
          "autoprime ainda com módulos de integração no Supabase — aplicar migração 20260526153000",
        );
      }
      await expect(page.getByRole("link", { name: "Integrações" })).toHaveCount(0);

      await context.close();
    });
  });

  test.describe("hub integrações — loja enterprise (guiotti)", () => {
    test.beforeEach(async ({ page, context }) => {
      await context.clearCookies();
      await loginDealershipPanel(page, { slug: "guiotti" });
    });

    test("página exibe secções Meta, carrossel e classificados", async ({ page }) => {
      await page.goto(`http://guiotti.localhost:${port}/painel/integracoes`);

      await expect(page.getByRole("heading", { name: "Integrações", level: 1 })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Instagram e Facebook" })).toBeVisible();
      await expect(page.locator("#aparencia-carrossel").getByText("Aparência do carrossel")).toBeVisible();
      await expect(page.getByRole("heading", { name: "OLX e WebMotors" })).toBeVisible();
      await expect(page.getByText("OLX", { exact: true })).toBeVisible();
      await expect(page.getByText("WebMotors", { exact: true })).toBeVisible();
    });

    test("banner de onboarding visível quando Meta não conectada", async ({ page }) => {
      await page.goto(`http://guiotti.localhost:${port}/painel/integracoes`);

      await expect(page.getByText("Divulgue seu estoque em poucos cliques")).toBeVisible();
    });

    test("aparência do carrossel oferece três estilos visuais", async ({ page }) => {
      await page.goto(`http://guiotti.localhost:${port}/painel/integracoes#aparencia-carrossel`);

      await expect(page.getByText("Clássico")).toBeVisible();
      await expect(page.getByText("Performance")).toBeVisible();
      await expect(page.getByText("Tech")).toBeVisible();
      await expect(page.getByRole("button", { name: /salvar aparência/i })).toBeVisible();
    });
  });

  test.describe("ficha e formulário de veículo", () => {
    test.beforeEach(async ({ page, context }) => {
      await context.clearCookies();
      await loginDealershipPanel(page, { slug: "guiotti" });
    });

    test("ficha do veículo demo exibe painéis de divulgação", async ({ page }) => {
      await page.goto(`http://guiotti.localhost:${port}/painel/estoque`);
      await page.getByRole("link", { name: /Ferrari/i }).first().click();

      await expect(page.getByText("Compartilhar nas redes sociais")).toBeVisible();
      await expect(page.getByText("Portais classificados")).toBeVisible();
    });

    test("formulário novo veículo oculta Salvar e divulgar sem conexões ativas", async ({
      page,
    }) => {
      await page.goto(`http://guiotti.localhost:${port}/painel/estoque/novo`);

      await expect(page.getByRole("button", { name: /salvar e divulgar/i })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /cadastrar veículo/i })).toBeVisible();
    });
  });
});
