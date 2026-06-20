import { expect, type BrowserContext, type Page, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const PANEL_ONBOARDING_COOKIE = "ap_panel_onboarding_v1";

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

function panelOrigin(slug: string): string {
  return `http://${slug}.localhost:${resolveDealershipPanelPort()}`;
}

/** Prevents the first-login onboarding dialog from blocking E2E clicks after clearCookies(). */
export async function setPanelOnboardingCompleteCookie(
  context: BrowserContext,
  slug: string,
) {
  await context.addCookies([
    {
      name: PANEL_ONBOARDING_COOKIE,
      value: "1",
      url: panelOrigin(slug),
    },
  ]);
}

export async function dismissPanelOnboardingIfVisible(page: Page) {
  const skipTour = page.getByRole("button", { name: "Pular tour" });
  if (await skipTour.isVisible().catch(() => false)) {
    await skipTour.click();
    await expect(
      page.getByRole("dialog", { name: "Bem-vindo ao painel" }),
    ).toBeHidden();
  }
}

/** Closes first-login tour and auto-open notification sheet that block Playwright clicks. */
export async function dismissDealershipPanelOverlays(page: Page) {
  await dismissPanelOnboardingIfVisible(page);

  const notificationSheet = page.getByRole("dialog", { name: "Novidades da loja" });
  if (await notificationSheet.isVisible().catch(() => false)) {
    await page.keyboard.press("Escape");
    await expect(notificationSheet).toBeHidden();
  }
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

  await setPanelOnboardingCompleteCookie(page.context(), slug);
  await page.goto(`http://${slug}.localhost:${port}/login`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(new RegExp(`${redirectPath.replace(/\//g, "\\/")}(\\?|$)`));
  await dismissDealershipPanelOverlays(page);
}

/**
 * Same as loginDealershipPanel but skips when demo auth is unavailable (seed / Supabase env).
 * Set E2E_STRICT_PANEL_AUTH=true to fail instead of skip.
 */
export async function loginDealershipPanelOrSkip(
  page: Page,
  options: DealershipPanelLoginOptions = {},
) {
  const defaults = resolveDemoDealershipCredentials();
  const slug = options.slug ?? defaults.slug;
  const email = options.email ?? defaults.email;
  const password = options.password ?? defaults.password;
  const redirectPath = options.redirectPath ?? "/painel";
  const port = resolveDealershipPanelPort();

  await setPanelOnboardingCompleteCookie(page.context(), slug);
  await page.goto(`http://${slug}.localhost:${port}/login`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  const redirectRe = new RegExp(`${redirectPath.replace(/\//g, "\\/")}(\\?|$)`);
  try {
    await expect(page).toHaveURL(redirectRe, { timeout: 20_000 });
    await dismissDealershipPanelOverlays(page);
  } catch {
    const strict =
      process.env.E2E_STRICT_PANEL_AUTH?.trim().toLowerCase() === "true";
    const hint =
      `Login painel demo falhou (${email}). ` +
      `Confira Supabase no .env.local e rode npm run seed:demo-users. ` +
      `Use E2E_STRICT_PANEL_AUTH=true para falhar em vez de skip.`;
    if (strict) {
      throw new Error(hint);
    }
    test.skip(true, hint);
  }
}

export async function resetStuckClassifiedsConnections(slug?: string) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const resolvedSlug = slug ?? resolveDemoDealershipCredentials().slug;

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: dealership } = await admin
    .from("dealerships")
    .select("id")
    .eq("slug", resolvedSlug)
    .maybeSingle();

  if (!dealership?.id) {
    return;
  }

  await admin
    .from("dealership_classifieds_credentials")
    .delete()
    .eq("dealership_id", dealership.id);

  await admin
    .from("dealership_classifieds_connections")
    .update({
      status: "disconnected",
      token_expires_at: null,
      connected_at: null,
      last_error: null,
    })
    .eq("dealership_id", dealership.id);
}

export async function postClassifiedsOAuthStart(
  page: Page,
  provider: "olx" | "webmotors" | "icarros",
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
