import Link from "next/link";

import {
  LEAD_SOURCE_LABELS,
  type LeadNoteItem,
} from "@autopainel/shared/types/lead-crm";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@autopainel/shared/ui";

import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { LeadClaimButton } from "@/components/leads/lead-claim-button";

import { formatDatePt } from "@/lib/format/format-date-pt";
import {
  buildLeadWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/phone/build-whatsapp-url";

import {
  LeadAssigneeSelect,
  type LeadAssigneeOption,
} from "@/components/leads/lead-assignee-select";

export interface LeadListItem {
  id: string;
  client_name: string;
  phone: string;
  type: string;
  source?: string | null;
  status: string;
  client_email?: string | null;
  message?: string | null;
  created_at: string;
  next_follow_up_at?: string | null;
  converted_vehicle_id?: string | null;
  assigned_user_id: string | null;
  loss_reason_code?: string | null;
  loss_reason_note?: string | null;
  notes?: LeadNoteItem[];
  vehicles: {
    id: string;
    brand: string;
    model: string;
    public_slug: string;
  } | null;
}

interface LeadListProps {
  leads: LeadListItem[];
  viewerRole: string;
  canManageAssignments: boolean;
  assignees: LeadAssigneeOption[];
  onOpenDetail?: (lead: LeadListItem) => void;
}

const typeLabel: Record<string, string> = {
  contact: "Contato",
  simulation: "Simulação",
};

export function LeadList({
  leads,
  viewerRole,
  canManageAssignments,
  assignees,
  onOpenDetail,
}: LeadListProps) {
  if (leads.length === 0) {
    const sellerHint =
      viewerRole === "seller"
        ? "Nenhum contato foi atribuído a você. Peça ao gestor da loja para designar responsáveis nos leads."
        : "Ainda não há contatos recebidos pela vitrine.";
    return (
      <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
        {sellerHint}
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Veículo</TableHead>
              {canManageAssignments ? <TableHead>Responsável</TableHead> : null}
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const vehicle = lead.vehicles;
              const vehicleLabel = vehicle
                ? `${vehicle.brand} ${vehicle.model}`
                : null;
              const wa = buildWhatsAppUrl(
                lead.phone,
                buildLeadWhatsAppMessage({
                  clientName: lead.client_name,
                  vehicleLabel,
                }),
              );
              return (
                <TableRow key={lead.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDatePt(lead.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">{lead.client_name}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{typeLabel[lead.type] ?? lead.type}</TableCell>
                  <TableCell>
                    <LeadStatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell>
                    {lead.source ? LEAD_SOURCE_LABELS[lead.source] ?? lead.source : "—"}
                  </TableCell>
                  <TableCell>
                    {vehicle ? (
                      <Link
                        href={`/veiculo/${vehicle.id}`}
                        className="font-medium text-primary underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {vehicle.brand} {vehicle.model}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  {canManageAssignments ? (
                    <TableCell>
                      <LeadAssigneeSelect
                        leadId={lead.id}
                        value={lead.assigned_user_id}
                        assignees={assignees}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <LeadClaimButton
                        leadId={lead.id}
                        canClaim={viewerRole === "seller" && lead.assigned_user_id === null}
                      />
                      {onOpenDetail ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenDetail(lead)}
                        >
                          Detalhes
                        </Button>
                      ) : null}
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" asChild>
                        <a href={wa} target="_blank" rel="noopener noreferrer">
                          WhatsApp
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 lg:hidden">
        {leads.map((lead) => {
          const vehicle = lead.vehicles;
          const vehicleLabel = vehicle
            ? `${vehicle.brand} ${vehicle.model}`
            : null;
          const wa = buildWhatsAppUrl(
            lead.phone,
            buildLeadWhatsAppMessage({
              clientName: lead.client_name,
              vehicleLabel,
            }),
          );
          return (
            <li
              key={lead.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{lead.client_name}</p>
                  <p className="text-sm text-muted-foreground">{lead.phone}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <LeadStatusBadge status={lead.status} />
                    <p className="text-xs text-muted-foreground">
                      {formatDatePt(lead.created_at)} ·{" "}
                      {typeLabel[lead.type] ?? lead.type}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <LeadClaimButton
                    leadId={lead.id}
                    canClaim={viewerRole === "seller" && lead.assigned_user_id === null}
                  />
                  <div className="flex gap-2">
                  {onOpenDetail ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenDetail(lead)}
                    >
                      Detalhes
                    </Button>
                  ) : null}
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" asChild>
                    <a href={wa} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                  </Button>
                  </div>
                </div>
              </div>
              {vehicle ? (
                <p className="mt-3 text-sm">
                  <span className="text-muted-foreground">Veículo: </span>
                  <Link
                    href={`/veiculo/${vehicle.id}`}
                    className="font-medium text-primary underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {vehicle.brand} {vehicle.model}
                  </Link>
                </p>
              ) : null}
              {canManageAssignments ? (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Responsável
                  </p>
                  <div className="mt-2">
                    <LeadAssigneeSelect
                      leadId={lead.id}
                      value={lead.assigned_user_id}
                      assignees={assignees}
                    />
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
