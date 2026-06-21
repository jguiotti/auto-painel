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

function panelLoginUrl(slug: string): string {
  return `${panelOrigin(slug)}/login`;
}

async function gotoPanelLogin(page: Page, slug: string) {
  const url = panelLoginUrl(slug);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      return;
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
}

/** Avoid native GET submit before React hydrates the login form (shows ?email=&password= in URL). */
async function waitForPanelLoginFormReady(page: Page) {
  await expect(page.getByRole("heading", { name: "Entrar no painel" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator("#email")).toBeEditable({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
}

async function waitForSupabaseAuthCookie(page: Page) {
  await page
    .waitForFunction(
      () =>
        document.cookie
          .split(";")
          .some(
            (part) =>
              part.trim().startsWith("sb-") && part.includes("auth-token"),
          ),
      { timeout: 15_000 },
    )
    .catch(() => {
      // Hosted cookie names vary; URL redirect is the primary signal.
    });
}

async function submitPanelLogin(
  page: Page,
  slug: string,
  email: string,
  password: string,
  redirectPath: string,
) {
  const redirectRe = new RegExp(`${redirectPath.replace(/\//g, "\\/")}(\\?|$)`);

  for (let attempt = 0; attempt < 2; attempt++) {
    if (page.url().includes("password=") || page.url().includes("email=")) {
      await gotoPanelLogin(page, slug);
    }

    await waitForPanelLoginFormReady(page);
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);

    try {
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page.getByRole("button", { name: "Entrando…" })).toBeVisible({
        timeout: 5_000,
      }).catch(() => undefined);
      await expect(page).toHaveURL(redirectRe, { timeout: 30_000 });
      await waitForSupabaseAuthCookie(page);
      if (redirectRe.test(page.url())) {
        return;
      }
    } catch {
      if (attempt === 1) {
        break;
      }
      await gotoPanelLogin(page, slug);
    }
  }

  await expect(page).toHaveURL(redirectRe);
  await waitForSupabaseAuthCookie(page);
}

/** Navigate to a protected panel route; re-authenticates if middleware redirects to login. */
export async function gotoAuthenticatedPanelPath(
  page: Page,
  slug: string,
  path: string,
  options: Omit<DealershipPanelLoginOptions, "slug" | "redirectPath"> = {},
) {
  const origin = panelOrigin(slug);
  const targetUrl = `${origin}${path.startsWith("/") ? path : `/${path}`}`;

  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });

  if (page.url().includes("/login")) {
    await loginDealershipPanel(page, {
      slug,
      redirectPath: path,
      ...options,
    });
  }

  if (!page.url().includes(path.split("?")[0] ?? path)) {
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
  }

  if (page.url().includes("/login")) {
    await loginDealershipPanel(page, {
      slug,
      redirectPath: path,
      ...options,
    });
    await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, "\\/")}(\\?|#|$)`));
  }

  await dismissDealershipPanelOverlays(page);
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

  await setPanelOnboardingCompleteCookie(page.context(), slug);
  await gotoPanelLogin(page, slug);
  await submitPanelLogin(page, slug, email, password, redirectPath);
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

  await setPanelOnboardingCompleteCookie(page.context(), slug);
  await gotoPanelLogin(page, slug);

  try {
    await submitPanelLogin(page, slug, email, password, redirectPath);
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
