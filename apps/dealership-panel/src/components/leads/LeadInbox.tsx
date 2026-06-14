"use client";

import { Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  LEAD_PIPELINE_STATUSES,
  LEAD_PIPELINE_STATUS_LABELS,
  type SoldVehicleOption,
} from "@autopainel/shared/types/lead-crm";
import { EmptyState } from "@autopainel/shared/components/empty-state";
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@autopainel/shared/ui";

import { CreateManualLeadDialog } from "@/components/leads/create-manual-lead-dialog";
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet";
import { LeadList, type LeadListItem } from "@/components/leads/LeadList";
import type { LeadAssigneeOption } from "@/components/leads/lead-assignee-select";

interface LeadInboxProps {
  leads: LeadListItem[];
  viewerRole: string;
  canManageAssignments: boolean;
  canCreateManual: boolean;
  assignees: LeadAssigneeOption[];
  soldVehicles: SoldVehicleOption[];
}

export function LeadInbox({
  leads,
  viewerRole,
  canManageAssignments,
  canCreateManual,
  assignees,
  soldVehicles,
}: LeadInboxProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "contact" | "simulation">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailLead, setDetailLead] = useState<LeadListItem | null>(null);

  useEffect(() => {
    if (!detailLead) {
      return;
    }
    const updated = leads.find((lead) => lead.id === detailLead.id);
    if (updated) {
      setDetailLead(updated);
    }
  }, [leads, detailLead?.id]);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (typeFilter !== "all" && lead.type !== typeFilter) {
        return false;
      }
      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const vehicleLabel = lead.vehicles
        ? `${lead.vehicles.brand} ${lead.vehicles.model}`.toLowerCase()
        : "";
      return (
        lead.client_name.toLowerCase().includes(normalizedQuery) ||
        lead.phone.toLowerCase().includes(normalizedQuery) ||
        vehicleLabel.includes(normalizedQuery)
      );
    });
  }, [leads, query, typeFilter, statusFilter]);

  if (leads.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <CreateManualLeadDialog canCreate={canCreateManual} />
        </div>
        <EmptyState
          icon={Inbox}
          title="Nenhum contato ainda"
          description="Quando clientes enviarem mensagens ou simulações pela vitrine, eles aparecerão aqui. Você também pode cadastrar contatos manualmente."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Pipeline comercial: acompanhe status, follow-up e conversão.
        </p>
        <CreateManualLeadDialog canCreate={canCreateManual} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
          <div className="space-y-2">
            <Label htmlFor="lead-search">Buscar contato</Label>
            <Input
              id="lead-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, telefone ou veículo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-type-filter">Tipo</Label>
            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as "all" | "contact" | "simulation")
              }
            >
              <SelectTrigger id="lead-type-filter">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="contact">Interesse no veículo</SelectItem>
                <SelectItem value="simulation">Simulação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="lead-status-filter">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {LEAD_PIPELINE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {LEAD_PIPELINE_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {filteredLeads.length} de {leads.length} contato(s) exibidos
        </p>
      </div>

      <LeadList
        leads={filteredLeads}
        viewerRole={viewerRole}
        canManageAssignments={canManageAssignments}
        assignees={assignees}
        onOpenDetail={setDetailLead}
      />

      <LeadDetailSheet
        lead={detailLead}
        open={detailLead !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailLead(null);
          }
        }}
        soldVehicles={soldVehicles}
      />
    </div>
  );
}
