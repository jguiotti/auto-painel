"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  PiggyBank,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { cn } from "@autopainel/shared/lib/utils";
import {
  PLATFORM_EXPENSE_CATEGORIES,
  PLATFORM_EXPENSE_CATEGORY_LABELS,
  PLATFORM_REVENUE_CATEGORIES,
  PLATFORM_REVENUE_CATEGORY_LABELS,
  type PlatformExpenseEntryRow,
  type PlatformFinanceDashboardSnapshot,
  type PlatformFinanceHealthLevel,
  type PlatformRevenueEntryRow,
} from "@autopainel/shared/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmActionDialog,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@autopainel/shared/ui";

import {
  createPlatformExpenseEntryAction,
  createPlatformRevenueEntryAction,
  deletePlatformExpenseEntryAction,
  deletePlatformRevenueEntryAction,
} from "@/actions/platform-internal-finance";
import { FinanceTable } from "@/components/finance-table";
import { PlatformFinanceSettingsForm } from "@/components/platform-finance-settings-form";
import type { DealershipAdminRow } from "@/types/dealership-admin";

type FinanceTab = "overview" | "subscriptions" | "revenue" | "expenses" | "settings";

const TABS: Array<{ id: FinanceTab; label: string }> = [
  { id: "overview", label: "Saúde financeira" },
  { id: "subscriptions", label: "Assinaturas" },
  { id: "revenue", label: "Receitas" },
  { id: "expenses", label: "Despesas" },
  { id: "settings", label: "Simulador" },
];

interface PlatformFinanceDashboardClientProps {
  snapshot: PlatformFinanceDashboardSnapshot;
  allRevenueEntries: PlatformRevenueEntryRow[];
  allExpenseEntries: PlatformExpenseEntryRow[];
  subscriptionRows: DealershipAdminRow[];
  monthlyRatePercent: number;
}

function formatBrl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatMonthLabel(referenceMonth: string): string {
  const parsed = new Date(`${referenceMonth.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return referenceMonth;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function healthLabel(level: PlatformFinanceHealthLevel): string {
  if (level === "healthy") {
    return "Saudável";
  }
  if (level === "attention") {
    return "Atenção";
  }
  return "Crítico";
}

function healthBadgeClass(level: PlatformFinanceHealthLevel): string {
  if (level === "healthy") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300";
  }
  if (level === "attention") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200";
  }
  return "border-destructive/40 bg-destructive/10 text-destructive";
}

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  hint?: ReactNode;
  icon: typeof Wallet;
  tone?: "default" | "positive" | "negative" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "negative"
        ? "text-destructive"
        : tone === "warning"
          ? "text-amber-700 dark:text-amber-300"
          : "text-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        <p className={cn("text-2xl font-semibold tracking-tight", toneClass)}>{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function defaultReferenceMonthInput(referenceMonth: string): string {
  return referenceMonth.slice(0, 7);
}

export function PlatformFinanceDashboardClient({
  snapshot,
  allRevenueEntries,
  allExpenseEntries,
  subscriptionRows,
  monthlyRatePercent,
}: PlatformFinanceDashboardClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<FinanceTab>("overview");
  const [isPending, startTransition] = useTransition();
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [revenueSuccess, setRevenueSuccess] = useState<string | null>(null);
  const [expenseSuccess, setExpenseSuccess] = useState<string | null>(null);

  const monthLabel = useMemo(
    () => formatMonthLabel(snapshot.referenceMonth),
    [snapshot.referenceMonth],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Saúde da AutoPainel, receitas, despesas e assinaturas das lojas — competência{" "}
            <span className="font-medium text-foreground">{monthLabel}</span>.
          </p>
        </div>
        <Badge variant="outline" className={healthBadgeClass(snapshot.healthLevel)}>
          Saúde: {healthLabel(snapshot.healthLevel)}
        </Badge>
      </div>

      <nav
        className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
        aria-label="Financeiro AutoPainel"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab === item.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="MRR contratado"
              value={formatBrl(snapshot.mrrContracted)}
              hint="Soma das mensalidades ativas (exceto lojas isentas)"
              icon={TrendingUp}
            />
            <KpiCard
              title="Recebido no mês"
              value={formatBrl(snapshot.totalRevenueMonth)}
              hint={`SaaS ${formatBrl(snapshot.billingReceivedMonth)} + manual ${formatBrl(snapshot.manualRevenueMonth)}`}
              icon={ArrowUpRight}
              tone="positive"
            />
            <KpiCard
              title="Despesas no mês"
              value={formatBrl(snapshot.totalExpenseMonth)}
              hint={`Manual ${formatBrl(snapshot.manualExpenseMonth)} + comissões ${formatBrl(snapshot.commissionsMonth)}`}
              icon={ArrowDownRight}
              tone="negative"
            />
            <KpiCard
              title="Resultado líquido"
              value={formatBrl(snapshot.netResultMonth)}
              hint="Receitas − despesas na competência atual"
              icon={PiggyBank}
              tone={snapshot.netResultMonth >= 0 ? "positive" : "negative"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Lojas ativas"
              value={String(snapshot.activeDealerships)}
              hint={`${snapshot.billingExemptDealerships} isentas de cobrança`}
              icon={Building2}
            />
            <KpiCard
              title="Inadimplência"
              value={formatBrl(snapshot.billingOverdueTotal)}
              hint={`${snapshot.overdueDealershipsCount} loja(s) com mensalidade vencida`}
              icon={AlertTriangle}
              tone={snapshot.billingOverdueTotal > 0 ? "warning" : "default"}
            />
            <KpiCard
              title="A receber no mês"
              value={formatBrl(snapshot.billingPendingMonth)}
              hint="Mensalidades pendentes na competência"
              icon={Wallet}
            />
            <KpiCard
              title="Upgrades abertos"
              value={String(snapshot.openUpgradeRequests)}
              hint={
                snapshot.openUpgradeRequests > 0 ? (
                  <Link href="/painel/solicitacoes-upgrade" className="underline">
                    Ver fila operacional
                  </Link>
                ) : (
                  "Nenhuma solicitação na fila"
                )
              }
              icon={TrendingUp}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inadimplência recente</CardTitle>
              <CardDescription>
                Mensalidades com status vencido — priorize cobrança ou contato comercial.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {snapshot.overdueBillingLines.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma mensalidade vencida no momento.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loja</TableHead>
                      <TableHead>Competência</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshot.overdueBillingLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell className="font-medium">{line.dealershipName}</TableCell>
                        <TableCell>{formatMonthLabel(line.billingPeriodStart)}</TableCell>
                        <TableCell>
                          {line.dueDate
                            ? new Date(`${line.dueDate}T12:00:00`).toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell>{formatBrl(line.expectedAmount)}</TableCell>
                        <TableCell className="text-right">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <Link href={`/painel/concessionarias/${line.dealershipId}/editar`}>
                              Abrir loja
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "subscriptions" ? (
        <FinanceTable rows={subscriptionRows} embedded />
      ) : null}

      {tab === "revenue" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Nova receita</CardTitle>
              <CardDescription>
                Registre receitas extras além das mensalidades SaaS já lançadas por loja.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  setRevenueError(null);
                  setRevenueSuccess(null);
                  const formData = new FormData(event.currentTarget);
                  startTransition(async () => {
                    const result = await createPlatformRevenueEntryAction(formData);
                    if (result.error) {
                      setRevenueError(result.error);
                      return;
                    }
                    setRevenueSuccess("Receita cadastrada.");
                    event.currentTarget.reset();
                    router.refresh();
                  });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="revenue-month">Competência</Label>
                  <Input
                    id="revenue-month"
                    name="reference_month"
                    type="month"
                    defaultValue={defaultReferenceMonthInput(snapshot.referenceMonth)}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue-category">Categoria</Label>
                  <select
                    id="revenue-category"
                    name="category"
                    defaultValue="services"
                    disabled={isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {PLATFORM_REVENUE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {PLATFORM_REVENUE_CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue-amount">Valor (R$)</Label>
                  <Input
                    id="revenue-amount"
                    name="amount"
                    inputMode="decimal"
                    placeholder="0,00"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue-description">Descrição</Label>
                  <Input
                    id="revenue-description"
                    name="description"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue-recognized">Data de reconhecimento</Label>
                  <Input
                    id="revenue-recognized"
                    name="recognized_at"
                    type="date"
                    disabled={isPending}
                  />
                </div>
                {revenueError ? <p className="text-sm text-destructive">{revenueError}</p> : null}
                {revenueSuccess ? (
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">{revenueSuccess}</p>
                ) : null}
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Salvando…" : "Cadastrar receita"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receitas cadastradas</CardTitle>
              <CardDescription>
                Competência atual: {formatBrl(snapshot.manualRevenueMonth)} em lançamentos manuais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EntryTable
                kind="revenue"
                rows={allRevenueEntries}
                isPending={isPending}
                onDelete={(id) =>
                  deletePlatformRevenueEntryAction(id).then((result) => {
                    if (!result.error) {
                      router.refresh();
                    }
                    return result;
                  })
                }
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "expenses" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Nova despesa</CardTitle>
              <CardDescription>
                Infra, marketing, pessoal e outros custos operacionais da plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  setExpenseError(null);
                  setExpenseSuccess(null);
                  const formData = new FormData(event.currentTarget);
                  startTransition(async () => {
                    const result = await createPlatformExpenseEntryAction(formData);
                    if (result.error) {
                      setExpenseError(result.error);
                      return;
                    }
                    setExpenseSuccess("Despesa cadastrada.");
                    event.currentTarget.reset();
                    router.refresh();
                  });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="expense-month">Competência</Label>
                  <Input
                    id="expense-month"
                    name="reference_month"
                    type="month"
                    defaultValue={defaultReferenceMonthInput(snapshot.referenceMonth)}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Categoria</Label>
                  <select
                    id="expense-category"
                    name="category"
                    defaultValue="other"
                    disabled={isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {PLATFORM_EXPENSE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {PLATFORM_EXPENSE_CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-vendor">Fornecedor (opcional)</Label>
                  <Input id="expense-vendor" name="vendor_name" disabled={isPending} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Valor (R$)</Label>
                  <Input
                    id="expense-amount"
                    name="amount"
                    inputMode="decimal"
                    placeholder="0,00"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-description">Descrição</Label>
                  <Input
                    id="expense-description"
                    name="description"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-paid">Pago em (opcional)</Label>
                  <Input id="expense-paid" name="paid_at" type="date" disabled={isPending} />
                </div>
                {expenseError ? <p className="text-sm text-destructive">{expenseError}</p> : null}
                {expenseSuccess ? (
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">{expenseSuccess}</p>
                ) : null}
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Salvando…" : "Cadastrar despesa"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Despesas cadastradas</CardTitle>
              <CardDescription>
                Competência atual: {formatBrl(snapshot.manualExpenseMonth)} manual +{" "}
                {formatBrl(snapshot.commissionsMonth)} comissões aprovadas/pagas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EntryTable
                kind="expense"
                rows={allExpenseEntries}
                isPending={isPending}
                onDelete={(id) =>
                  deletePlatformExpenseEntryAction(id).then((result) => {
                    if (!result.error) {
                      router.refresh();
                    }
                    return result;
                  })
                }
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "settings" ? (
        <PlatformFinanceSettingsForm monthlyRatePercent={monthlyRatePercent} />
      ) : null}
    </div>
  );
}

function EntryTable({
  kind,
  rows,
  isPending,
  onDelete,
}: {
  kind: "revenue" | "expense";
  rows: PlatformRevenueEntryRow[] | PlatformExpenseEntryRow[];
  isPending: boolean;
  onDelete: (id: string) => Promise<{ error?: string }>;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum lançamento cadastrado ainda.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Competência</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead className="w-[60px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{formatMonthLabel(row.referenceMonth)}</TableCell>
            <TableCell>
              {kind === "revenue"
                ? PLATFORM_REVENUE_CATEGORY_LABELS[
                    (row as PlatformRevenueEntryRow).category
                  ]
                : PLATFORM_EXPENSE_CATEGORY_LABELS[
                    (row as PlatformExpenseEntryRow).category
                  ]}
            </TableCell>
            <TableCell>
              <div>{row.description}</div>
              {kind === "expense" && (row as PlatformExpenseEntryRow).vendorName ? (
                <div className="text-xs text-muted-foreground">
                  {(row as PlatformExpenseEntryRow).vendorName}
                </div>
              ) : null}
            </TableCell>
            <TableCell>{formatBrl(row.amount)}</TableCell>
            <TableCell>
              <ConfirmActionDialog
                title={kind === "revenue" ? "Excluir receita?" : "Excluir despesa?"}
                description="Este lançamento será removido do dashboard interno."
                confirmLabel="Excluir"
                confirmVariant="destructive"
                onConfirm={() => onDelete(row.id)}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                    aria-label="Excluir lançamento"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                }
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
