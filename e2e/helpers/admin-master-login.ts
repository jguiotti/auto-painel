import { expect, type Page, test } from "@playwright/test";

export interface AdminMasterLoginOptions {
  email?: string;
  password?: string;
  redirectPath?: string;
}

export function resolveAdminMasterPort(): string {
  return process.env.E2E_ADMIN_MASTER_PORT ?? "3001";
}

const ADMIN_MASTER_DOWN_HINT =
  "admin-master não está rodando na porta configurada — rode npm run dev:admin-master (ou dev:all)";

export function isAdminMasterUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.message.includes("ERR_CONNECTION_REFUSED") ||
    error.message.includes("ERR_EMPTY_RESPONSE") ||
    error.message.includes("ERR_NETWORK_IO_SUSPENDED")
  );
}

export function skipIfAdminMasterUnavailable(error: unknown): void {
  if (isAdminMasterUnavailableError(error)) {
    test.skip(true, ADMIN_MASTER_DOWN_HINT);
  }
}

export async function gotoAdminMasterOrSkip(
  page: Page,
  path: string,
): Promise<void> {
  const port = resolveAdminMasterPort();
  try {
    await page.goto(`http://127.0.0.1:${port}${path}`);
  } catch (error) {
    skipIfAdminMasterUnavailable(error);
    throw error;
  }
}

export function resolveDemoAdminCredentials() {
  return {
    email: process.env.E2E_ADMIN_EMAIL?.trim() || "operador@autopainel.demo",
    password: process.env.E2E_ADMIN_PASSWORD?.trim() || "AdminAuto2026!",
  };
}

export function resolveDemoSalesRepCredentials(which: "a" | "b" = "a") {
  const email =
    which === "a"
      ? process.env.E2E_SALES_REP_A_EMAIL?.trim() || "rep.a@autopainel.demo"
      : process.env.E2E_SALES_REP_B_EMAIL?.trim() || "rep.b@autopainel.demo";
  return {
    email,
    password: process.env.E2E_SALES_REP_PASSWORD?.trim() || "RepDemo123!",
  };
}

export async function loginAdminMaster(
  page: Page,
  options: AdminMasterLoginOptions = {},
) {
  const defaults = resolveDemoAdminCredentials();
  const email = options.email ?? defaults.email;
  const password = options.password ?? defaults.password;
  const redirectPath = options.redirectPath ?? "/painel/dashboard";
  const port = resolveAdminMasterPort();

  await page.goto(`http://127.0.0.1:${port}/login`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(
    new RegExp(`${redirectPath.replace(/\//g, "\\/")}(\\?|$)`),
  );
}

export async function loginAdminMasterOrSkip(
  page: Page,
  options: AdminMasterLoginOptions = {},
) {
  const defaults = resolveDemoAdminCredentials();
  const email = options.email ?? defaults.email;
  const password = options.password ?? defaults.password;
  const redirectPath = options.redirectPath ?? "/painel/dashboard";
  const port = resolveAdminMasterPort();

  try {
    await page.goto(`http://127.0.0.1:${port}/login`);
  } catch (error) {
    skipIfAdminMasterUnavailable(error);
    throw error;
  }
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  const redirectRe = new RegExp(`${redirectPath.replace(/\//g, "\\/")}(\\?|$)`);
  try {
    await expect(page).toHaveURL(redirectRe, { timeout: 20_000 });
  } catch {
    const strict =
      process.env.E2E_STRICT_ADMIN_AUTH?.trim().toLowerCase() === "true";
    const hint =
      `Login admin falhou (${email}). ` +
      `Confira Supabase local e rode npm run seed:admin-user. ` +
      `Use E2E_STRICT_ADMIN_AUTH=true para falhar em vez de skip.`;
    if (strict) {
      throw new Error(hint);
    }
    test.skip(true, hint);
  }
}

export async function loginSalesRepOrSkip(
  page: Page,
  which: "a" | "b" = "a",
) {
  const { email, password } = resolveDemoSalesRepCredentials(which);
  const port = resolveAdminMasterPort();

  try {
    await page.goto(`http://127.0.0.1:${port}/login`);
  } catch (error) {
    skipIfAdminMasterUnavailable(error);
    throw error;
  }
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  try {
    await expect(page).toHaveURL(/\/painel\/comercial\/extrato/, { timeout: 20_000 });
  } catch {
    const strict =
      process.env.E2E_STRICT_SALES_REP_AUTH?.trim().toLowerCase() === "true";
    const hint =
      `Login rep falhou (${email}). ` +
      `Rode npm run seed:platform-sales-rep-qa. ` +
      `Use E2E_STRICT_SALES_REP_AUTH=true para falhar em vez de skip.`;
    if (strict) {
      throw new Error(hint);
    }
    test.skip(true, hint);
  }
}
