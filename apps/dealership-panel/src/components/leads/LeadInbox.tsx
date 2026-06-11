"use client";

import { Inbox } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@autopainel/shared/components/empty-state";
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@autopainel/shared/ui";

import { LeadList, type LeadListItem } from "@/components/leads/LeadList";
import type { LeadAssigneeOption } from "@/components/leads/lead-assignee-select";

interface LeadInboxProps {
  leads: LeadListItem[];
  viewerRole: string;
  canManageAssignments: boolean;
  assignees: LeadAssigneeOption[];
}

export function LeadInbox({
  leads,
  viewerRole,
  canManageAssignments,
  assignees,
}: LeadInboxProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "contact" | "simulation">("all");

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (typeFilter !== "all" && lead.type !== typeFilter) {
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
  }, [leads, query, typeFilter]);

  if (leads.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Nenhum contato ainda"
        description="Quando clientes enviarem mensagens ou simulações pela vitrine, eles aparecerão aqui."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
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
      />
    </div>
  );
}
