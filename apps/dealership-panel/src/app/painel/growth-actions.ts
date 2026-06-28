"use server";

import { mapAgingMetricsFromRpc } from "@autopainel/shared/lib/growth-operations/map-aging-metrics";
import { mapStockLimitStatusFromRpc } from "@autopainel/shared/lib/growth-operations/map-stock-limit-status";
import type {
  CreateDealershipSupportRequestInput,
  CreateDealershipSupportRequestResult,
  DealershipStockLimitStatus,
  GetDealershipInventoryAgingMetricsResult,
} from "@autopainel/shared/types";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

function mapSupportRequestRpcError(message: string): string {
  if (message.includes("unauthorized")) {
    return "Você não tem permissão para registrar esta solicitação.";
  }
  if (message.includes("invalid_request_type")) {
    return "Tipo de solicitação inválido.";
  }
  return "Não foi possível registrar a solicitação. Tente novamente.";
}

export async function fetchDealershipStockLimitStatusAction(): Promise<DealershipStockLimitStatus | null> {
  const { supabase } = await requireDashboardSession();

  const { data, error } = await supabase.rpc("get_dealership_stock_limit_status");

  if (error) {
    return null;
  }

  return mapStockLimitStatusFromRpc(data);
}

export async function createDealershipSupportRequestAction(
  input: CreateDealershipSupportRequestInput,
): Promise<
  | { success: true; result: CreateDealershipSupportRequestResult; duplicateToday?: boolean }
  | { error: string }
> {
  const { supabase, dealershipId, profile } = await requireDashboardSession();

  const canRequest =
    profile.role === "owner" ||
    profile.role === "manager" ||
    profile.role === "super_admin";

  if (!canRequest) {
    return { error: "Somente titular ou gestor pode enviar solicitações." };
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: existingToday } = await supabase
    .from("dealership_support_requests")
    .select("id")
    .eq("dealership_id", dealershipId)
    .eq("request_type", input.requestType)
    .gte("created_at", startOfDay.toISOString())
    .limit(1);

  const duplicateToday = (existingToday?.length ?? 0) > 0;

  const { data, error } = await supabase.rpc("create_dealership_support_request", {
    p_request_type: input.requestType,
    p_message: input.message ?? null,
    p_desired_plan_slug: input.desiredPlanSlug ?? null,
    p_metadata: input.metadata ?? {},
  });

  if (error) {
    return { error: mapSupportRequestRpcError(error.message) };
  }

  const row = data as Record<string, unknown> | null;
  if (!row?.request_id || !row.sla_due_at) {
    return { error: "Resposta inválida ao registrar solicitação." };
  }

  return {
    success: true,
    duplicateToday,
    result: {
      requestId: String(row.request_id),
      slaDueAt: String(row.sla_due_at),
    },
  };
}

export async function fetchDealershipInventoryAgingMetricsAction(): Promise<
  GetDealershipInventoryAgingMetricsResult | { error: string; moduleInactive?: boolean }
> {
  const { supabase } = await requireDashboardSession();

  const { data, error } = await supabase.rpc("get_dealership_inventory_aging_metrics", {
    p_dealership_id: null,
    p_attention_threshold_days: 45,
    p_leads_window_days: 30,
  });

  if (error) {
    if (error.message.includes("module_not_enabled")) {
      return { error: "Módulo de métricas avançadas não está ativo no seu plano.", moduleInactive: true };
    }
    return { error: "Não foi possível carregar as métricas de estoque." };
  }

  const mapped = mapAgingMetricsFromRpc(data);
  if (!mapped) {
    return { error: "Não foi possível interpretar as métricas de estoque." };
  }

  return mapped;
}
