import { expect, test } from "@playwright/test";

import { STORE_NOT_FOUND_CTA_RE, TENANT_ERROR_HEADING_RE } from "../helpers/tenant-error-page";

const storefrontPort = process.env.E2E_CUSTOMER_SITE_PORT ?? "3003";

test.describe.configure({ mode: "serial" });

/**
 * Requires `customer-site` running with Supabase env.
 */
test.describe("customer-site tenant routing", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("bare loopback cannot resolve storefront tenant → erro ou redirect dev", async ({
    page,
  }) => {
    const devSlug =
      process.env.NEXT_PUBLIC_DEVELOPMENT_TENANT_SLUG?.trim() ||
      process.env.DEVELOPMENT_TENANT_SLUG?.trim();
    test.skip(
      !!devSlug,
      "Com NEXT_PUBLIC_DEVELOPMENT_TENANT_SLUG / DEVELOPMENT_TENANT_SLUG o middleware pode redireccionar para *.localhost.",
    );

    await page.goto(`http://127.0.0.1:${storefrontPort}/`);
    await expect(page).toHaveURL(/\/erro\/concessionaria/);
    await expect(
      page.getByRole("heading", {
        name: TENANT_ERROR_HEADING_RE,
      }),
    ).toBeVisible();
  });

  test("missing slug subdomain → erro", async ({ page }) => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const fakeSlug = `e2e-store-${suffix}`;
    await page.goto(`http://${fakeSlug}.localhost:${storefrontPort}/`);
    await expect(page).toHaveURL(/\/erro\/concessionaria/);
    await expect(
      page.getByRole("heading", {
        name: TENANT_ERROR_HEADING_RE,
      }),
    ).toBeVisible();
  });

  test("error page: direct path shows unified heading", async ({ page }) => {
    await page.goto(`http://127.0.0.1:${storefrontPort}/erro/concessionaria`);
    await expect(
      page.getByRole("heading", { name: TENANT_ERROR_HEADING_RE }),
    ).toBeVisible();
  });

  test("error page: single h1 and hero without 404 wording", async ({ page }) => {
    await page.goto(`http://127.0.0.1:${storefrontPort}/erro/concessionaria`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(TENANT_ERROR_HEADING_RE);
    await expect(h1).not.toContainText(/404/i);
  });

  test("error page: no technical disclosure and CTA to AutoPainel home", async ({ page }) => {
    await page.goto(`http://127.0.0.1:${storefrontPort}/erro/concessionaria`);
    await expect(page.getByText("Detalhes para a equipe técnica")).toHaveCount(0);
    await expect(page.getByText(/Checklist \(desenvolvimento\)/i)).toHaveCount(0);
    await expect(page.getByRole("link", { name: STORE_NOT_FOUND_CTA_RE })).toBeVisible();
  });

  test("dealership slug loads storefront home when status is active", async ({
    page,
  }) => {
    const slug = process.env.E2E_DEALERSHIP_SLUG?.trim();
    test.skip(!slug, "Define E2E_DEALERSHIP_SLUG no .env.local.");

    await page.goto(`http://${slug}.localhost:${storefrontPort}/`);

    const storefrontErro = page.url().includes("/erro/concessionaria");
    const strictStorefront =
      process.env.E2E_STRICT_STOREFRONT_ACTIVE?.trim().toLowerCase() ===
      "true";

    if (storefrontErro) {
      const hint =
        `customer-site uses resolve_dealership_id_by_host (active dealerships only). ` +
        `Slug "${slug}" may exist for dashboard but not storefront — set dealerships.status = active ` +
        `or unset E2E_DEALERSHIP_SLUG for this assertion. Use E2E_STRICT_STOREFRONT_ACTIVE=true to fail instead of skip.`;

      if (strictStorefront) {
        throw new Error(hint);
      }
      test.skip(true, hint);
    }

    await expect(page.locator("body")).toBeVisible();
  });
});
