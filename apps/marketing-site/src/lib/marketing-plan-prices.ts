/** Canonical public prices (BRL/month) — marketing always shows the highest agreed value. */
export const MARKETING_PUBLIC_PLAN_PRICES_BRL: Record<string, number> = {
  starter: 197,
  business: 397,
  enterprise: 997,
};

/** One-time onboarding + initial stock import (Anexo Comercial — épico crescimento). */
export const MARKETING_PUBLIC_SETUP_FEE_BRL = 497;

/**
 * Typical active-inventory band per commercial tier (used for plan recommendation).
 * Final plan is confirmed at proposal time based on the dealership's stock volume.
 */
export const MARKETING_PLAN_STOCK_BANDS: Record<string, string> = {
  starter: "Até 40 veículos",
  business: "41 a 80 veículos",
  enterprise: "Acima de 80 veículos",
};

export const MARKETING_PUBLIC_PLAN_NAMES: Record<string, string> = {
  starter: "Essencial",
  business: "Profissional",
  enterprise: "Completo",
};

export function resolveMarketingPlanPriceBrl(slug: string, dbAmount: unknown): number {
  const canonical = MARKETING_PUBLIC_PLAN_PRICES_BRL[slug];
  const parsedDb = Number(dbAmount);
  const dbValue = Number.isFinite(parsedDb) && parsedDb > 0 ? parsedDb : 0;

  if (canonical == null) {
    return dbValue;
  }

  return Math.max(canonical, dbValue);
}

export function formatMarketingPlanPriceLabel(slug: string, dbAmount: unknown): string {
  const amount = resolveMarketingPlanPriceBrl(slug, dbAmount);
  if (amount <= 0) {
    return "Sob consulta";
  }

  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formatted}/mês`;
}

export function formatMarketingSetupFeeLabel(): string {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(MARKETING_PUBLIC_SETUP_FEE_BRL);

  return formatted;
}

export function resolveMarketingPlanStockBand(slug: string): string {
  return MARKETING_PLAN_STOCK_BANDS[slug] ?? "Sob consulta";
}
