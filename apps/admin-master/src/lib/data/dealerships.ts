import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";
import {
  parseStorefrontLayoutId,
  type StorefrontLayoutTemplateId,
} from "@autopainel/shared/types";
import type { StorefrontThemeMode } from "@autopainel/shared/types";

import type { DealershipAdminRow } from "@/types/dealership-admin";

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

const UUID_LOOSE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeRow(raw: Record<string, unknown>): DealershipAdminRow {
  const ef = raw.enabled_features;
  const layoutSource =
    raw.layout_id !== undefined && raw.layout_id !== null
      ? raw.layout_id
      : undefined;
  const layout_id: StorefrontLayoutTemplateId =
    parseStorefrontLayoutId(layoutSource);

  const pid = raw.pricing_plan_id;
  const pricing_plan_id =
    typeof pid === "string" && UUID_LOOSE.test(pid) ? pid : null;

  const theme_config = asRecord(raw.theme_config);
  const storefront_theme_mode: StorefrontThemeMode =
    theme_config.storefront_theme_mode === "dark" ? "dark" : "light";

  return {
    ...(raw as unknown as DealershipAdminRow),
    theme_settings: asRecord(raw.theme_settings),
    theme_config,
    content_config: asRecord(raw.content_config),
    enabled_features: Array.isArray(ef)
      ? ef.filter((x): x is string => typeof x === "string")
      : [],
    pricing_plan_id,
    layout_id,
    storefront_theme_mode,
  };
}

const DEALERSHIP_ADMIN_LIST_COLUMNS =
  "id, name, slug, custom_domain, theme_settings, theme_config, status, subscription_plan, subscription_status, subscription_current_period_end, pricing_plan_id, layout_id, created_at, updated_at";

export async function fetchDealershipsForAdminList(): Promise<DealershipAdminRow[]> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }
  const { data, error } = await supabase
    .from("dealerships")
    .select(DEALERSHIP_ADMIN_LIST_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchDealershipsForAdminList", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    normalizeRow({
      ...(row as Record<string, unknown>),
      content_config: {},
      enabled_features: [],
      cnpj: null,
      logo_url: null,
      whatsapp_number: null,
      contact_email: null,
      billing_notes: null,
    }),
  );
}

export async function fetchDealerships(): Promise<DealershipAdminRow[]> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }
  const { data, error } = await supabase
    .from("dealerships")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchDealerships", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    normalizeRow(row as Record<string, unknown>),
  );
}
