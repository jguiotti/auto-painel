import { expect, type Page } from "@playwright/test";

export interface DealershipPanelLoginOptions {
  slug?: string;
  email?: string;
  password?: string;
  redirectPath?: string;
}

export function resolveDealershipPanelPort(): string {
  return process.env.E2E_DEALERSHIP_PANEL_PORT ?? "3002";
}

export function resolveDemoDealershipCredentials() {
  return {
    slug: process.env.E2E_DEALERSHIP_SLUG?.trim() || "guiotti",
    email:
      process.env.E2E_DEALERSHIP_EMAIL?.trim() ||
      "gestor.guiotti@autopainel.demo",
    password: process.env.E2E_DEALERSHIP_PASSWORD?.trim() || "LojaDemo123!",
  };
}

export async function loginDealershipPanel(
  page: Page,
  options: DealershipPanelLoginOptions = {},
) {
  const defaults = resolveDemoDealershipCredentials();
  const slug = options.slug ?? defaults.slug;
  const email = options.email ?? defaults.email;
  const password = options.password ?? defaults.password;
  const redirectPath = options.redirectPath ?? "/painel";
  const port = resolveDealershipPanelPort();

  await page.goto(`http://${slug}.localhost:${port}/login`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(new RegExp(`${redirectPath.replace(/\//g, "\\/")}(\\?|$)`));
}

export async function postClassifiedsOAuthStart(
  page: Page,
  provider: "olx" | "webmotors",
) {
  return page.evaluate(async (providerKey) => {
    const res = await fetch(
      `/api/painel/integracoes/oauth/start?provider=${providerKey}`,
      { method: "POST" },
    );
    const body = (await res.json()) as { code?: string; error?: string };
    return { status: res.status, body };
  }, provider);
}
