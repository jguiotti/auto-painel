"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@autopainel/shared/ui";

import { updateLeadAssigneeAction } from "@/app/painel/contatos/actions";

export interface LeadAssigneeOption {
  id: string;
  role: string;
}

function optionLabel(option: LeadAssigneeOption): string {
  const rolePt = option.role === "owner" ? "Gestor" : "Vendedor";
  return `${rolePt} · ${option.id.slice(0, 8)}…`;
}

interface LeadAssigneeSelectProps {
  leadId: string;
  value: string | null;
  assignees: LeadAssigneeOption[];
}

export function LeadAssigneeSelect({
  leadId,
  value,
  assignees,
}: LeadAssigneeSelectProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const selectValue = value ?? "__unassigned__";

  function onValueChange(next: string) {
    setError(null);
    const assignedUserId = next === "__unassigned__" ? null : next;
    startTransition(async () => {
      const res = await updateLeadAssigneeAction(leadId, assignedUserId);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="min-w-[200px] space-y-1">
      <Select
        value={selectValue}
        onValueChange={onValueChange}
        disabled={pending}
      >
        <SelectTrigger className="h-9" aria-label="Atribuir responsável">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__unassigned__">— Sem responsável —</SelectItem>
          {assignees.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {optionLabel(a)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
