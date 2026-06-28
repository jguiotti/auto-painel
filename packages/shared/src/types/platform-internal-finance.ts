export type PlatformRevenueCategory =
  | "saas_subscription"
  | "setup_fee"
  | "services"
  | "other";

export type PlatformExpenseCategory =
  | "commission"
  | "infra"
  | "marketing"
  | "payroll"
  | "other";

export const PLATFORM_REVENUE_CATEGORIES: PlatformRevenueCategory[] = [
  "saas_subscription",
  "setup_fee",
  "services",
  "other",
];

export const PLATFORM_EXPENSE_CATEGORIES: PlatformExpenseCategory[] = [
  "commission",
  "infra",
  "marketing",
  "payroll",
  "other",
];

export const PLATFORM_REVENUE_CATEGORY_LABELS: Record<PlatformRevenueCategory, string> = {
  saas_subscription: "Assinatura SaaS",
  setup_fee: "Taxa de setup",
  services: "Serviços",
  other: "Outros",
};

export const PLATFORM_EXPENSE_CATEGORY_LABELS: Record<PlatformExpenseCategory, string> = {
  commission: "Comissões",
  infra: "Infraestrutura",
  marketing: "Marketing",
  payroll: "Pessoal",
  other: "Outros",
};

export interface PlatformRevenueEntryRow {
  id: string;
  referenceMonth: string;
  category: PlatformRevenueCategory;
  amount: number;
  description: string;
  recognizedAt: string;
  createdAt: string;
}

export interface PlatformExpenseEntryRow {
  id: string;
  referenceMonth: string;
  category: PlatformExpenseCategory;
  amount: number;
  description: string;
  vendorName: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PlatformFinanceOverdueLine {
  id: string;
  dealershipId: string;
  dealershipName: string;
  expectedAmount: number;
  dueDate: string;
  billingPeriodStart: string;
}

export type PlatformFinanceHealthLevel = "healthy" | "attention" | "critical";

export interface PlatformFinanceDashboardSnapshot {
  referenceMonth: string;
  mrrContracted: number;
  billingReceivedMonth: number;
  billingPendingMonth: number;
  billingOverdueTotal: number;
  manualRevenueMonth: number;
  manualExpenseMonth: number;
  commissionsMonth: number;
  totalRevenueMonth: number;
  totalExpenseMonth: number;
  netResultMonth: number;
  activeDealerships: number;
  billingExemptDealerships: number;
  overdueDealershipsCount: number;
  openUpgradeRequests: number;
  healthLevel: PlatformFinanceHealthLevel;
  revenueEntries: PlatformRevenueEntryRow[];
  expenseEntries: PlatformExpenseEntryRow[];
  overdueBillingLines: PlatformFinanceOverdueLine[];
}
