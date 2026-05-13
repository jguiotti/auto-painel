import { expect, test } from "@playwright/test";

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
  });

  test("missing slug subdomain → erro", async ({ page }) => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const fakeSlug = `e2e-store-${suffix}`;
    await page.goto(`http://${fakeSlug}.localhost:${storefrontPort}/`);
    await expect(page).toHaveURL(/\/erro\/concessionaria/);
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
