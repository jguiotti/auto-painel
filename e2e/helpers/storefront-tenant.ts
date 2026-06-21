import { expect, test, type Page } from "@playwright/test";

import { TENANT_ERROR_HEADING_RE } from "./tenant-error-page";

export function resolveStorefrontPort(): string {
  return process.env.E2E_CUSTOMER_SITE_PORT ?? "3003";
}

/** Slug with `dealerships.status = active` for public storefront (see e2e/README.md). */
export function resolveActiveStorefrontSlug(): string {
  return process.env.E2E_DEALERSHIP_SLUG?.trim() || "guiotti";
}

export async function gotoStorefront(
  page: Page,
  path = "/",
  slug = resolveActiveStorefrontSlug(),
): Promise<string> {
  const port = resolveStorefrontPort();
  const url = `http://${slug}.localhost:${port}${path}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      return slug;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes("ERR_ABORTED") ||
        message.includes("ERR_CONNECTION_REFUSED") ||
        message.includes("Timeout");
      if (!retryable || attempt === 2) {
        throw error;
      }
      await page.waitForTimeout(1_000 * (attempt + 1));
    }
  }

  return slug;
}

/**
 * Skips when the vitrine cannot resolve the tenant (inactive slug, Supabase down, wrong env).
 * Set E2E_STRICT_STOREFRONT_ACTIVE=true to fail instead of skip.
 */
export async function skipIfStorefrontTenantUnavailable(
  page: Page,
  slug: string,
): Promise<void> {
  const strict =
    process.env.E2E_STRICT_STOREFRONT_ACTIVE?.trim().toLowerCase() === "true";

  const onErrorRoute = page.url().includes("/erro/concessionaria");
  const errorHeading = page.getByRole("heading", { name: TENANT_ERROR_HEADING_RE });
  const hasErrorHeading = await errorHeading.isVisible().catch(() => false);

  if (!onErrorRoute && !hasErrorHeading) {
    return;
  }

  const hint =
    `Vitrine indisponível para slug "${slug}" (precisa status active + Supabase). ` +
    `Confira .env.local, npm run supabase:start e npm run seed:demo-users. ` +
    `Use E2E_STRICT_STOREFRONT_ACTIVE=true para falhar em vez de skip.`;

  if (strict) {
    throw new Error(hint);
  }

  test.skip(true, hint);
}

/** Desktop: «Contato»; mobile: menu → «Fale conosco» (BZ-CRM-006). */
export async function clickStorefrontContatoNav(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 900 });

  const desktopLink = page.getByRole("link", { name: "Contato", exact: true });
  try {
    await desktopLink.waitFor({ state: "visible", timeout: 8_000 });
    await desktopLink.click();
    return;
  } catch {
    // Fall through to mobile nav.
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });

  const menuButton = page.getByRole("button", { name: "Menu" });
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  const mobileContato = page
    .locator("#storefront-mobile-menu")
    .getByRole("link", { name: "Fale conosco" });
  await expect(mobileContato).toBeVisible();
  await mobileContato.click();
}
