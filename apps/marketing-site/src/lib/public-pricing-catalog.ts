import { createSupabaseAnonClient } from "@autopainel/shared/lib/supabase";

import {
  PLAN_MODULES,
  PRICING_PLANS,
} from "@/lib/plans-catalog";

export interface PublicPricingPlan {
  slug: string;
  name: string;
  description: string | null;
  priceLabel: string;
  tagline: string;
}

export interface PublicPricingModule {
  key: string;
  label: string;
  description: string;
  planSlugs: string[];
}

export interface PublicPricingCatalog {
  plans: PublicPricingPlan[];
  modules: PublicPricingModule[];
  source: "database" | "static";
}

const MARKETING_PLAN_TAGLINES: Record<string, string> = {
  starter: "Presença digital essencial",
  business: "Operação comercial completa",
  enterprise: "Integrações e escala",
};

function formatPriceLabel(priceAmount: unknown): string {
  const amount = Number(priceAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return "Sob consulta";
  }
  return "Sob consulta";
}

function staticFallbackCatalog(): PublicPricingCatalog {
  return {
    source: "static",
    plans: PRICING_PLANS.map((plan) => ({
      slug: plan.id,
      name: plan.name,
      description: plan.tagline,
      priceLabel: plan.priceLabel,
      tagline: plan.tagline,
    })),
    modules: PLAN_MODULES.map((module) => ({
      key: module.key,
      label: module.label,
      description: module.description,
      planSlugs: [
        module.starter ? "starter" : null,
        module.business ? "business" : null,
        module.enterprise ? "enterprise" : null,
      ].filter((slug): slug is string => slug !== null),
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
    plans: plans.map((plan) => ({
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      priceLabel: formatPriceLabel(plan.price_amount),
      tagline: MARKETING_PLAN_TAGLINES[plan.slug] ?? plan.description ?? "",
    })),
    modules: modules.map((module) => ({
      key: module.key,
      label: module.label,
      description: module.description,
      planSlugs: module.plan_slugs ?? [],
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
