import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";
import type {
  PlatformExpenseCategory,
  PlatformExpenseEntryRow,
  PlatformFinanceDashboardSnapshot,
  PlatformFinanceHealthLevel,
  PlatformFinanceOverdueLine,
  PlatformRevenueCategory,
  PlatformRevenueEntryRow,
} from "@autopainel/shared/types";

function currentReferenceMonth(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}-01`;
}

function monthPrefix(referenceMonth: string): string {
  return referenceMonth.slice(0, 7);
}

function isSameMonth(isoDate: string | null | undefined, referenceMonth: string): boolean {
  if (!isoDate) {
    return false;
  }
  return isoDate.slice(0, 7) === monthPrefix(referenceMonth);
}

function parseAmount(value: unknown): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function parseRevenueCategory(value: unknown): PlatformRevenueCategory {
  if (
    value === "saas_subscription" ||
    value === "setup_fee" ||
    value === "services" ||
    value === "other"
  ) {
    return value;
  }
  return "other";
}

function parseExpenseCategory(value: unknown): PlatformExpenseCategory {
  if (
    value === "commission" ||
    value === "infra" ||
    value === "marketing" ||
    value === "payroll" ||
    value === "other"
  ) {
    return value;
  }
  return "other";
}

function resolveHealthLevel(
  overdueTotal: number,
  pendingTotal: number,
  mrrContracted: number,
): PlatformFinanceHealthLevel {
  if (overdueTotal <= 0) {
    return pendingTotal > mrrContracted * 0.15 ? "attention" : "healthy";
  }
  if (overdueTotal > mrrContracted * 0.2 || overdueTotal > 5000) {
    return "critical";
  }
  return "attention";
}

export async function fetchPlatformFinanceDashboard(): Promise<PlatformFinanceDashboardSnapshot> {
  const referenceMonth = currentReferenceMonth();
  const empty: PlatformFinanceDashboardSnapshot = {
    referenceMonth,
    mrrContracted: 0,
    billingReceivedMonth: 0,
    billingPendingMonth: 0,
    billingOverdueTotal: 0,
    manualRevenueMonth: 0,
    manualExpenseMonth: 0,
    commissionsMonth: 0,
    totalRevenueMonth: 0,
    totalExpenseMonth: 0,
    netResultMonth: 0,
    activeDealerships: 0,
    billingExemptDealerships: 0,
    overdueDealershipsCount: 0,
    openUpgradeRequests: 0,
    healthLevel: "healthy",
    revenueEntries: [],
    expenseEntries: [],
    overdueBillingLines: [],
  };

  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return empty;
  }

  const [
    dealershipsResult,
    billingResult,
    historyResult,
    revenueResult,
    expenseResult,
    commissionsResult,
    upgradeRequestsResult,
  ] = await Promise.all([
    supabase
      .from("dealerships")
      .select("id, name, status, billing_exempt")
      .neq("status", "churned"),
    supabase
      .from("dealership_billing")
      .select("dealership_id, monthly_amount, agreement_status")
      .eq("agreement_status", "active"),
    supabase
      .from("dealership_billing_history")
      .select(
        "id, dealership_id, billing_period_start, expected_amount, settlement_status, due_date, paid_at, dealerships(name)",
      )
      .order("due_date", { ascending: true })
      .limit(500),
    supabase
      .from("platform_revenue_entries")
      .select("id, reference_month, category, amount, description, recognized_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("platform_expense_entries")
      .select(
        "id, reference_month, category, amount, description, vendor_name, paid_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("platform_commission_ledger_entries")
      .select("amount_cents, reference_month, status")
      .in("status", ["approved", "paid"])
      .limit(500),
    supabase
      .from("dealership_support_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  const dealerships = dealershipsResult.data ?? [];
  const billingRows = billingResult.data ?? [];
  const historyRows = historyResult.data ?? [];

  const exemptIds = new Set(
    dealerships.filter((row) => row.billing_exempt).map((row) => String(row.id)),
  );

  const activeDealerships = dealerships.filter((row) => row.status === "active").length;
  const billingExemptDealerships = exemptIds.size;

  let mrrContracted = 0;
  for (const row of billingRows) {
    if (exemptIds.has(String(row.dealership_id))) {
      continue;
    }
    mrrContracted += parseAmount(row.monthly_amount);
  }

  let billingReceivedMonth = 0;
  let billingPendingMonth = 0;
  let billingOverdueTotal = 0;
  const overdueDealershipIds = new Set<string>();
  const overdueBillingLines: PlatformFinanceOverdueLine[] = [];

  for (const row of historyRows) {
    const amount = parseAmount(row.expected_amount);
    const status = String(row.settlement_status ?? "pending");
    const dealershipJoin = Array.isArray(row.dealerships) ? row.dealerships[0] : row.dealerships;
    const dealershipName =
      dealershipJoin && typeof dealershipJoin === "object" && "name" in dealershipJoin
        ? String(dealershipJoin.name ?? "Concessionária")
        : "Concessionária";

    if (status === "paid") {
      if (
        isSameMonth(row.paid_at, referenceMonth) ||
        isSameMonth(row.billing_period_start, referenceMonth)
      ) {
        billingReceivedMonth += amount;
      }
      continue;
    }

    if (status === "pending") {
      if (isSameMonth(row.billing_period_start, referenceMonth)) {
        billingPendingMonth += amount;
      }
      continue;
    }

    if (status === "overdue") {
      billingOverdueTotal += amount;
      overdueDealershipIds.add(String(row.dealership_id));
      overdueBillingLines.push({
        id: String(row.id),
        dealershipId: String(row.dealership_id),
        dealershipName,
        expectedAmount: amount,
        dueDate: String(row.due_date ?? ""),
        billingPeriodStart: String(row.billing_period_start ?? ""),
      });
    }
  }

  const revenueEntries: PlatformRevenueEntryRow[] = (revenueResult.data ?? [])
    .filter((row) => isSameMonth(String(row.reference_month ?? ""), referenceMonth))
    .map((row) => ({
      id: String(row.id),
      referenceMonth: String(row.reference_month),
      category: parseRevenueCategory(row.category),
      amount: parseAmount(row.amount),
      description: String(row.description ?? ""),
      recognizedAt: String(row.recognized_at ?? row.reference_month),
      createdAt: String(row.created_at ?? ""),
    }));

  const expenseEntries: PlatformExpenseEntryRow[] = (expenseResult.data ?? [])
    .filter((row) => isSameMonth(String(row.reference_month ?? ""), referenceMonth))
    .map((row) => ({
      id: String(row.id),
      referenceMonth: String(row.reference_month),
      category: parseExpenseCategory(row.category),
      amount: parseAmount(row.amount),
      description: String(row.description ?? ""),
      vendorName: typeof row.vendor_name === "string" ? row.vendor_name : null,
      paidAt: typeof row.paid_at === "string" ? row.paid_at : null,
      createdAt: String(row.created_at ?? ""),
    }));

  let manualRevenueMonth = 0;
  for (const entry of revenueEntries) {
    manualRevenueMonth += entry.amount;
  }

  let manualExpenseMonth = 0;
  for (const entry of expenseEntries) {
    manualExpenseMonth += entry.amount;
  }

  let commissionsMonth = 0;
  for (const row of commissionsResult.data ?? []) {
    if (!isSameMonth(String(row.reference_month ?? ""), referenceMonth)) {
      continue;
    }
    commissionsMonth += parseAmount(row.amount_cents) / 100;
  }

  const totalRevenueMonth = billingReceivedMonth + manualRevenueMonth;
  const totalExpenseMonth = manualExpenseMonth + commissionsMonth;
  const netResultMonth = totalRevenueMonth - totalExpenseMonth;

  return {
    referenceMonth,
    mrrContracted,
    billingReceivedMonth,
    billingPendingMonth,
    billingOverdueTotal,
    manualRevenueMonth,
    manualExpenseMonth,
    commissionsMonth,
    totalRevenueMonth,
    totalExpenseMonth,
    netResultMonth,
    activeDealerships,
    billingExemptDealerships,
    overdueDealershipsCount: overdueDealershipIds.size,
    openUpgradeRequests: upgradeRequestsResult.count ?? 0,
    healthLevel: resolveHealthLevel(
      billingOverdueTotal,
      billingPendingMonth,
      mrrContracted,
    ),
    revenueEntries,
    expenseEntries,
    overdueBillingLines: overdueBillingLines.slice(0, 12),
  };
}

export async function fetchAllPlatformRevenueEntries(): Promise<PlatformRevenueEntryRow[]> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }

  const { data } = await supabase
    .from("platform_revenue_entries")
    .select("id, reference_month, category, amount, description, recognized_at, created_at")
    .order("reference_month", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    referenceMonth: String(row.reference_month),
    category: parseRevenueCategory(row.category),
    amount: parseAmount(row.amount),
    description: String(row.description ?? ""),
    recognizedAt: String(row.recognized_at ?? row.reference_month),
    createdAt: String(row.created_at ?? ""),
  }));
}

export async function fetchAllPlatformExpenseEntries(): Promise<PlatformExpenseEntryRow[]> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }

  const { data } = await supabase
    .from("platform_expense_entries")
    .select(
      "id, reference_month, category, amount, description, vendor_name, paid_at, created_at",
    )
    .order("reference_month", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    referenceMonth: String(row.reference_month),
    category: parseExpenseCategory(row.category),
    amount: parseAmount(row.amount),
    description: String(row.description ?? ""),
    vendorName: typeof row.vendor_name === "string" ? row.vendor_name : null,
    paidAt: typeof row.paid_at === "string" ? row.paid_at : null,
    createdAt: String(row.created_at ?? ""),
  }));
}
