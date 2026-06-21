"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileText } from "lucide-react";

import { EmptyState } from "@autopainel/shared/components/empty-state";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@autopainel/shared/ui";

import {
  PLATFORM_CONTRACT_STATUS_LABELS,
  type PlatformContractRow,
} from "@/lib/data/platform-contracts-shared";

function formatDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatMoney(value: number | string | null): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "—";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

interface PlatformContractsTableProps {
  rows: PlatformContractRow[];
}

export function PlatformContractsTable({ rows }: PlatformContractsTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhum contrato ainda"
        description="Crie um rascunho para revisão antes do envio à assinatura."
        action={{ label: "Novo contrato", href: "/painel/contratos/novo" }}
      />
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contratante</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="font-medium">{row.counterparty_name}</div>
                <div className="text-xs text-muted-foreground">{row.counterparty_email}</div>
              </TableCell>
              <TableCell>{row.plan_name ?? "—"}</TableCell>
              <TableCell>{formatMoney(row.monthly_amount)}</TableCell>
              <TableCell>{PLATFORM_CONTRACT_STATUS_LABELS[row.status]}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(row.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/painel/contratos/${row.id}`}>Abrir</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface CreateContractFormProps {
  templates: Array<{ id: string; name: string; version: number }>;
  defaultProspect?: {
    id: string;
    full_name: string;
    email: string;
    company_name: string | null;
  } | null;
}

export function CreateContractForm({
  templates,
  defaultProspect,
}: CreateContractFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const { createPlatformContractAction } = await import("@/actions/platform-contracts");
      const result = await createPlatformContractAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.contractId) {
        router.push(`/painel/contratos/${result.contractId}`);
      } else {
        router.push("/painel/contratos");
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="template_id">
          Modelo
        </label>
        <select
          id="template_id"
          name="template_id"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue={templates[0]?.id ?? ""}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} (v{template.version})
            </option>
          ))}
        </select>
      </div>

      {defaultProspect ? (
        <input type="hidden" name="saas_prospect_id" value={defaultProspect.id} />
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="counterparty_name">
          Nome da contratante
        </label>
        <input
          id="counterparty_name"
          name="counterparty_name"
          required
          defaultValue={defaultProspect?.company_name ?? defaultProspect?.full_name ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="counterparty_email">
          E-mail
        </label>
        <input
          id="counterparty_email"
          name="counterparty_email"
          type="email"
          required
          defaultValue={defaultProspect?.email ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="cnpj">
          CNPJ (opcional)
        </label>
        <input
          id="cnpj"
          name="cnpj"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="plan_name">
            Plano
          </label>
          <input
            id="plan_name"
            name="plan_name"
            required
            placeholder="Essencial"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="monthly_amount">
            Valor mensal (R$)
          </label>
          <input
            id="monthly_amount"
            name="monthly_amount"
            required
            placeholder="197"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="review_notes">
          Notas de revisão interna
        </label>
        <textarea
          id="review_notes"
          name="review_notes"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Pontos a validar com jurídico antes do envio…"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando…" : "Criar rascunho"}
      </Button>
    </form>
  );
}
