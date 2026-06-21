"use client";

import { useTransition } from "react";
import { Inbox } from "lucide-react";

import { EmptyState } from "@autopainel/shared/components/empty-state";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@autopainel/shared/ui";

import { updatePlatformCommercialLeadPipelineAction } from "@/actions/platform-commercial-leads";
import {
  PLATFORM_LEAD_PIPELINE_LABELS,
  PLATFORM_LEAD_PIPELINE_STATUSES,
  type PlatformCommercialLeadRow,
} from "@/lib/data/platform-commercial-leads-shared";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

interface PlatformCommercialLeadsTableProps {
  rows: PlatformCommercialLeadRow[];
  onLeadWon?: (lead: PlatformCommercialLeadRow) => void;
}

export function PlatformCommercialLeadsTable({
  rows,
  onLeadWon,
}: PlatformCommercialLeadsTableProps) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(leadId: string, nextStatus: string) {
    const lead = rows.find((row) => row.id === leadId);
    startTransition(async () => {
      const result = await updatePlatformCommercialLeadPipelineAction(leadId, nextStatus);
      if (!result.error && nextStatus === "won" && lead && onLeadWon) {
        onLeadWon(lead);
      }
    });
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Nenhum lead comercial ainda"
        description="Leads do site marketing e formulários aparecem aqui automaticamente."
      />
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contato</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Pipeline</TableHead>
            <TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="font-medium">{row.full_name}</div>
                <div className="text-xs text-muted-foreground">{row.email}</div>
                {row.phone ? (
                  <div className="text-xs text-muted-foreground">{row.phone}</div>
                ) : null}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {row.company_name ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{row.source}</TableCell>
              <TableCell>
                <Select
                  value={row.pipeline_status}
                  onValueChange={(value) => handleStatusChange(row.id, value)}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_LEAD_PIPELINE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {PLATFORM_LEAD_PIPELINE_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(row.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
