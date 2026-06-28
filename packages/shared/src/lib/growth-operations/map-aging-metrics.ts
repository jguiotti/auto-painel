import type { GetDealershipInventoryAgingMetricsResult } from "../../types/growth-operations";

export function mapAgingMetricsFromRpc(raw: unknown): GetDealershipInventoryAgingMetricsResult | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const summaryRaw = row.summary;
  const attentionRaw = row.attention_vehicles;

  if (!summaryRaw || typeof summaryRaw !== "object") {
    return null;
  }

  const summary = summaryRaw as Record<string, unknown>;
  const attentionList = Array.isArray(attentionRaw) ? attentionRaw : [];

  return {
    summary: {
      capitalImmobilized: Number(summary.capital_immobilized ?? 0),
      averageDaysInStock: Number(summary.average_days_in_stock ?? 0),
      estimatedDailyCarryingCost: Number(summary.estimated_daily_carrying_cost ?? 0),
      agedStockPercent: Number(summary.aged_stock_percent ?? 0),
      agedThresholdDays: Number(summary.aged_threshold_days ?? 45),
    },
    attentionVehicles: attentionList
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => ({
        vehicleId: String(entry.vehicle_id ?? ""),
        brand: String(entry.brand ?? ""),
        model: String(entry.model ?? ""),
        salePrice: Number(entry.sale_price ?? 0),
        daysInStock: Number(entry.days_in_stock ?? 0),
        leadsLast30Days: Number(entry.leads_last_30_days ?? 0),
        estimatedCarryingCost: Number(entry.estimated_carrying_cost ?? 0),
        suggestionKey: String(entry.suggestion_key ?? "review_price"),
      })),
  };
}
