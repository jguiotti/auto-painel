"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Building2, ExternalLink, FileSignature, Inbox, MoreHorizontal, Trash2 } from "lucide-react";

import { EmptyState } from "@autopainel/shared/components/empty-state";
import {
  Badge,
  Button,
  ConfirmActionDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

import {
  deletePlatformCommercialLeadAction,
  updatePlatformCommercialLeadPipelineAction,
} from "@/actions/platform-commercial-leads";
import {
  PLATFORM_LEAD_MANUAL_CHANNELS,
  PLATFORM_LEAD_PIPELINE_LABELS,
  PLATFORM_LEAD_PIPELINE_STATUSES,
  readDealershipIdFromLeadMetadata,
  readIntakeIdFromLeadMetadata,
  type PlatformCommercialLeadRow,
} from "@/lib/data/platform-commercial-leads-shared";

function formatSourceLabel(
  source: string,
  metadata: Record<string, unknown> | null,
): string {
  if (source === "trial_onboarding") {
    return "Trial — formulário";
  }
  if (source === "marketing_site") {
    return "Site marketing";
  }
  if (source === "admin_manual") {
    const channel = metadata?.lead_channel;
    const channelLabel = PLATFORM_LEAD_MANUAL_CHANNELS.find(
      (item) => item.value === channel,
    )?.label;
    return channelLabel ? `Manual — ${channelLabel}` : "Cadastro manual";
  }
  return source;
}

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
  const router = useRouter();
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
        description="Leads do site marketing e cadastros manuais aparecem aqui. Use «Novo lead» para prospecção ativa."
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
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const intakeId = readIntakeIdFromLeadMetadata(row.metadata);
            const dealershipId = readDealershipIdFromLeadMetadata(row.metadata);

            return (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="font-medium">{row.full_name}</div>
                  <div className="text-xs text-muted-foreground">{row.email}</div>
                  {row.phone ? (
                    <div className="text-xs text-muted-foreground">{row.phone}</div>
                  ) : null}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="truncate">{row.company_name ?? "—"}</div>
                  {dealershipId ? (
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      Loja vinculada
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatSourceLabel(row.source, row.metadata)}
                </TableCell>
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
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Ações do lead</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/painel/contratos/novo?lead=${row.id}`}>
                          <FileSignature className="mr-2 size-4" />
                          Criar contrato
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/painel/concessionarias/nova?lead=${row.id}`}>
                          <Building2 className="mr-2 size-4" />
                          Criar loja
                        </Link>
                      </DropdownMenuItem>
                      {dealershipId ? (
                        <DropdownMenuItem asChild>
                          <Link href={`/painel/concessionarias/${dealershipId}/editar`}>
                            <ExternalLink className="mr-2 size-4" />
                            Abrir loja
                          </Link>
                        </DropdownMenuItem>
                      ) : null}
                      {intakeId ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/painel/concessionarias/nova?intake=${intakeId}`}>
                              <ExternalLink className="mr-2 size-4" />
                              Ver adesão trial
                            </Link>
                          </DropdownMenuItem>
                        </>
                      ) : null}
                      <DropdownMenuSeparator />
                      <ConfirmActionDialog
                        title="Excluir lead comercial?"
                        description={
                          <>
                            <p>
                              O lead de <strong>{row.full_name}</strong> ({row.email}) será removido
                              da lista. Esta ação não pode ser desfeita.
                            </p>
                            {dealershipId ? (
                              <p>
                                A loja vinculada permanece ativa; apenas o registro do lead será
                                apagado.
                              </p>
                            ) : null}
                            {intakeId ? (
                              <p>
                                A adesão trial vinculada permanece no painel, mas sem lead
                                comercial associado.
                              </p>
                            ) : null}
                          </>
                        }
                        confirmLabel="Excluir lead"
                        confirmVariant="destructive"
                        onConfirm={async () => {
                          const result = await deletePlatformCommercialLeadAction(row.id);
                          if (!result.error) {
                            router.refresh();
                          }
                          return result;
                        }}
                        trigger={
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={(event) => event.preventDefault()}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Excluir lead
                          </DropdownMenuItem>
                        }
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
