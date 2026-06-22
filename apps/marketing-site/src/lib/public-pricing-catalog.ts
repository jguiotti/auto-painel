import { createSupabaseAnonClient } from "@autopainel/shared/lib/supabase";

import {
  formatMarketingPlanPriceLabel,
  formatMarketingSetupFeeLabel,
  MARKETING_PUBLIC_PLAN_NAMES,
  resolveMarketingPlanStockBand,
} from "@/lib/marketing-plan-prices";
import {
  MARKETING_MODULE_COMING_SOON_KEYS,
  PLAN_MODULES,
  PRICING_PLANS,
} from "@/lib/plans-catalog";

export interface PublicPricingPlan {
  slug: string;
  name: string;
  description: string | null;
  priceLabel: string;
  setupLabel: string;
  stockBandLabel: string;
  tagline: string;
}

export interface PublicPricingModule {
  key: string;
  label: string;
  description: string;
  planSlugs: string[];
  comingSoon?: boolean;
}

export interface PublicPricingCatalog {
  plans: PublicPricingPlan[];
  modules: PublicPricingModule[];
  setupFeeLabel: string;
  source: "database" | "static";
}

const MARKETING_PLAN_TAGLINES: Record<string, string> = {
  starter: "Presença digital essencial — ideal para até 10 veículos",
  business: "Simulador, QR Code e operação comercial — de 11 a 30 veículos",
  enterprise: "Integrações e escala digital — acima de 30 veículos",
};

const SETUP_FEE_LABEL = formatMarketingSetupFeeLabel();

function enrichPlan(slug: string, description: string | null, priceAmount: unknown) {
  return {
    slug,
    name: MARKETING_PUBLIC_PLAN_NAMES[slug] ?? slug,
    description,
    priceLabel: formatMarketingPlanPriceLabel(slug, priceAmount),
    setupLabel: SETUP_FEE_LABEL,
    stockBandLabel: resolveMarketingPlanStockBand(slug),
    tagline: MARKETING_PLAN_TAGLINES[slug] ?? description ?? "",
  };
}

function staticFallbackCatalog(): PublicPricingCatalog {
  return {
    source: "static",
    setupFeeLabel: SETUP_FEE_LABEL,
    plans: PRICING_PLANS.map((plan) =>
      enrichPlan(plan.id, plan.tagline, null),
    ),
    modules: PLAN_MODULES.map((module) => ({
      key: module.key,
      label: module.label,
      description: module.description,
      planSlugs: [
        module.starter ? "starter" : null,
        module.business ? "business" : null,
        module.enterprise ? "enterprise" : null,
      ].filter((slug): slug is string => slug !== null),
      comingSoon: module.comingSoon ?? MARKETING_MODULE_COMING_SOON_KEYS.has(module.key),
    })),
  };
}

function mapRpcCatalog(payload: {
  plans?: Array<{
    slug: string;
    name: string;
    description: string | null;
    price_amount: number | string;
  }>;
  modules?: Array<{
    key: string;
    label: string;
    description: string;
    plan_slugs: string[];
  }>;
}): PublicPricingCatalog | null {
  const plans = payload.plans ?? [];
  const modules = payload.modules ?? [];

  if (plans.length === 0) {
    return null;
  }

  return {
    source: "database",
    setupFeeLabel: SETUP_FEE_LABEL,
    plans: plans.map((plan) =>
      enrichPlan(plan.slug, plan.description, plan.price_amount),
    ),
    modules: modules.map((module) => ({
      key: module.key,
      label: module.label,
      description: module.description,
      planSlugs: module.plan_slugs ?? [],
      comingSoon: MARKETING_MODULE_COMING_SOON_KEYS.has(module.key),
    })),
  };
}

export async function fetchPublicPricingCatalog(): Promise<PublicPricingCatalog> {
  try {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase.rpc("list_public_pricing_marketing_catalog");

    if (error || !data || typeof data !== "object") {
      return staticFallbackCatalog();
    }

    const mapped = mapRpcCatalog(data as Parameters<typeof mapRpcCatalog>[0]);
    return mapped ?? staticFallbackCatalog();
  } catch {
    return staticFallbackCatalog();
  }
}
