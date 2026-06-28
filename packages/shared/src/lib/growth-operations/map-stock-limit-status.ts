import type { DealershipStockLimitStatus } from "../../types/growth-operations";

export function mapStockLimitStatusFromRpc(raw: unknown): DealershipStockLimitStatus | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const row = raw as Record<string, unknown>;

  return {
    eligibleCount: typeof row.eligible_count === "number" ? row.eligible_count : 0,
    maxActiveVehicles:
      row.max_active_vehicles === null || row.max_active_vehicles === undefined
        ? null
        : Number(row.max_active_vehicles),
    planSlug: typeof row.plan_slug === "string" ? row.plan_slug : null,
    planName: typeof row.plan_name === "string" ? row.plan_name : null,
    suggestedUpgradeSlug:
      typeof row.suggested_upgrade_slug === "string" ? row.suggested_upgrade_slug : null,
    suggestedUpgradeName:
      typeof row.suggested_upgrade_name === "string" ? row.suggested_upgrade_name : null,
    atLimit: row.at_limit === true,
    nearLimit: row.near_limit === true,
    warningRatio: typeof row.warning_ratio === "number" ? row.warning_ratio : 0,
  };
}
