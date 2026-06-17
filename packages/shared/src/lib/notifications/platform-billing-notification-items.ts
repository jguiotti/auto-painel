import type { NotificationCenterItem } from "../../components/notification-center";

function resolveDealershipJoin(
  dealerships:
    | { id?: string | null; name?: string | null; slug?: string | null }
    | { id?: string | null; name?: string | null; slug?: string | null }[]
    | null
    | undefined,
): { id?: string | null; name?: string | null; slug?: string | null } | null {
  if (Array.isArray(dealerships)) {
    return dealerships[0] ?? null;
  }
  return dealerships ?? null;
}

function formatCurrencyBrl(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function formatBillingPeriod(periodStart: string): string {
  const parsed = new Date(`${periodStart}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return periodStart;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function formatDueDate(dueDate: string): string {
  const parsed = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dueDate;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function mapBillingHistoryNotification(row: {
  id?: string;
  billing_period_start?: string | null;
  expected_amount?: number | null;
  settlement_status?: string | null;
  due_date?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  dealerships?:
    | { id?: string | null; name?: string | null; slug?: string | null }
    | { id?: string | null; name?: string | null; slug?: string | null }[]
    | null;
}): NotificationCenterItem | null {
  const status = row.settlement_status;
  if (status !== "overdue" && status !== "pending") {
    return null;
  }

  const dealership = resolveDealershipJoin(row.dealerships);
  const dealershipName = dealership?.name?.trim() || "Concessionária";
  const dealershipId = dealership?.id?.trim();
  const period = row.billing_period_start
    ? formatBillingPeriod(row.billing_period_start)
    : "Competência";
  const amount =
    typeof row.expected_amount === "number"
      ? formatCurrencyBrl(row.expected_amount)
      : null;
  const dueLabel = row.due_date ? formatDueDate(row.due_date) : null;

  const title =
    status === "overdue"
      ? `Mensalidade em atraso · ${dealershipName}`
      : `Mensalidade a vencer · ${dealershipName}`;

  const subtitleParts = [period];
  if (amount) {
    subtitleParts.push(amount);
  }
  if (dueLabel) {
    subtitleParts.push(
      status === "overdue" ? `Venceu em ${dueLabel}` : `Vence em ${dueLabel}`,
    );
  }

  return {
    id: `billing-${row.id ?? crypto.randomUUID()}`,
    title,
    subtitle: subtitleParts.join(" · "),
    href: dealershipId
      ? `/painel/concessionarias/${dealershipId}/editar`
      : "/painel/financeiro",
    createdAt: row.updated_at ?? row.created_at ?? undefined,
  };
}

export function mapDealershipStatusNotification(row: {
  id?: string;
  name?: string | null;
  status?: string | null;
  updated_at?: string | null;
}): NotificationCenterItem | null {
  const status = row.status;
  if (status !== "pending_setup" && status !== "suspended" && status !== "churned") {
    return null;
  }

  const dealershipName = row.name?.trim() || "Concessionária";
  const titleByStatus: Record<string, string> = {
    pending_setup: `Configuração pendente · ${dealershipName}`,
    suspended: `Concessionária suspensa · ${dealershipName}`,
    churned: `Concessionária encerrada · ${dealershipName}`,
  };
  const subtitleByStatus: Record<string, string> = {
    pending_setup: "Revise cadastro, plano e onboarding da loja.",
    suspended: "Acesso da loja bloqueado até regularização operacional.",
    churned: "Contrato encerrado — confira histórico financeiro.",
  };

  return {
    id: `dealership-status-${row.id ?? crypto.randomUUID()}`,
    title: titleByStatus[status] ?? dealershipName,
    subtitle: subtitleByStatus[status] ?? "Situação operacional da concessionária.",
    href: row.id ? `/painel/concessionarias/${row.id}/editar` : "/painel/concessionarias",
    createdAt: row.updated_at ?? undefined,
  };
}

export function isBillingAlertDueSoon(dueDate: string, withinDays = 14): boolean {
  const due = new Date(`${dueDate}T23:59:59`);
  if (Number.isNaN(due.getTime())) {
    return false;
  }
  const now = new Date();
  const limit = new Date(now);
  limit.setDate(limit.getDate() + withinDays);
  return due <= limit;
}
