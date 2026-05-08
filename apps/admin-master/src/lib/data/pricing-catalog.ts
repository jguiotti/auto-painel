import "server-only";

import { cache } from "react";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";
import type {
  PricingPlanListRow,
  SaasModuleListRow,
} from "@autopainel/shared/types";

export type PricingCatalogSchemaState =
  | { kind: "ok" }
  | { kind: "tables_missing" }
  | { kind: "unconfigured" }
  | { kind: "unknown_query_error"; message: string };

function isPostgrestTableMissing(error: {
  code?: string;
  message?: string;
}): boolean {
  if (error.code === "PGRST205") {
    return true;
  }
  const msg = error.message ?? "";
  return (
    msg.includes("Could not find the table") && msg.includes("schema cache")
  );
}

function logCatalogFetchFailure(scope: string, error: { message?: string }) {
  console.error(scope, error.message);
}

/** Single probe per request; pricing_plans and saas_modules ship in the same migration. */
export const getPricingCatalogSchemaState = cache(
  async (): Promise<PricingCatalogSchemaState> => {
    let supabase;
    try {
      supabase = createSupabaseServiceRoleClient();
    } catch {
      return { kind: "unconfigured" };
    }

    const { error } = await supabase
      .from("pricing_plans")
      .select("id")
      .limit(1);

    if (!error) {
      return { kind: "ok" };
    }

    if (isPostgrestTableMissing(error)) {
      return { kind: "tables_missing" };
    }

    logCatalogFetchFailure("getPricingCatalogSchemaState", error);
    return { kind: "unknown_query_error", message: error.message ?? "" };
  },
);

export async function fetchPricingPlansForAdmin(): Promise<PricingPlanListRow[]> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }

  const { data, error } = await supabase
    .from("pricing_plans")
    .select("id, slug, name, description, price_amount, currency_code, is_active")
    .order("slug", { ascending: true });

  if (error) {
    if (!isPostgrestTableMissing(error)) {
      logCatalogFetchFailure("fetchPricingPlansForAdmin", error);
    }
    return [];
  }

  return (data ?? []) as PricingPlanListRow[];
}

export async function fetchPricingPlanByIdForAdmin(
  id: string,
): Promise<PricingPlanListRow | null> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return null;
  }

  const { data, error } = await supabase
    .from("pricing_plans")
    .select("id, slug, name, description, price_amount, currency_code, is_active")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PricingPlanListRow;
}

export async function fetchPricingPlanModuleIdsForAdmin(
  planId: string,
): Promise<string[]> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }

  const { data, error } = await supabase
    .from("pricing_plan_modules")
    .select("module_id")
    .eq("pricing_plan_id", planId);

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => row.module_id as string)
    .filter((x): x is string => typeof x === "string" && x.length > 0);
}

export async function fetchSaasModulesForAdmin(): Promise<SaasModuleListRow[]> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }

  const { data, error } = await supabase
    .from("saas_modules")
    .select("id, key, display_name, description, is_active, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    if (!isPostgrestTableMissing(error)) {
      logCatalogFetchFailure("fetchSaasModulesForAdmin", error);
    }
    return [];
  }

  return (data ?? []) as SaasModuleListRow[];
}

export async function fetchSaasModuleByIdForAdmin(
  id: string,
): Promise<SaasModuleListRow | null> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return null;
  }

  const { data, error } = await supabase
    .from("saas_modules")
    .select("id, key, display_name, description, is_active, sort_order")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as SaasModuleListRow;
}
