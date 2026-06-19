"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  LEAD_LOSS_REASON_CODES,
  LEAD_LOSS_REASON_LABELS,
} from "@autopainel/shared/types";
import {
  LEAD_PIPELINE_STATUSES,
  LEAD_PIPELINE_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  type LeadNoteItem,
  type LeadPipelineStatus,
  type SoldVehicleOption,
} from "@autopainel/shared/types/lead-crm";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Textarea,
} from "@autopainel/shared/ui";

import {
  addLeadNoteAction,
  deleteLeadAction,
  updateLeadPipelineAction,
} from "@/app/painel/contatos/actions";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { LeadClaimButton } from "@/components/leads/lead-claim-button";
import { formatDatePt } from "@/lib/format/format-date-pt";
import {
  buildLeadWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/phone/build-whatsapp-url";

import type { LeadListItem } from "@/components/leads/LeadList";

interface LeadDetailSheetProps {
  lead: LeadListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  soldVehicles: SoldVehicleOption[];
  viewerRole: string;
  canManageAssignments: boolean;
}

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
  soldVehicles,
  viewerRole,
  canManageAssignments,
}: LeadDetailSheetProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [noteBody, setNoteBody] = useState("");
  const [lossReasonCode, setLossReasonCode] = useState<string>(
    lead?.loss_reason_code ?? "",
  );
  const [lossReasonNote, setLossReasonNote] = useState<string>(
    lead?.loss_reason_note ?? "",
  );

  useEffect(() => {
    if (!lead) {
      return;
    }
    setLossReasonCode(lead.loss_reason_code ?? "");
    setLossReasonNote(lead.loss_reason_note ?? "");
  }, [lead?.id, lead?.loss_reason_code, lead?.loss_reason_note]);

  if (!lead) {
    return null;
  }

  const vehicleLabel = lead.vehicles
    ? `${lead.vehicles.brand} ${lead.vehicles.model}`
    : null;
  const wa = buildWhatsAppUrl(
    lead.phone,
    buildLeadWhatsAppMessage({
      clientName: lead.client_name,
      vehicleLabel,
    }),
  );

  function runUpdate(
    patch: Parameters<typeof updateLeadPipelineAction>[1],
  ) {
    setError(null);
    startTransition(async () => {
      const payload = { ...patch };
      if (payload.status === "lost" || lead!.status === "lost") {
        payload.lossReasonCode = lossReasonCode || null;
        payload.lossReasonNote = lossReasonNote || null;
      }
      const res = await updateLeadPipelineAction(lead!.id, payload);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm("Excluir este contato permanentemente? Esta ação não pode ser desfeita.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteLeadAction(lead!.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  function submitNote() {
    setError(null);
    startTransition(async () => {
      const res = await addLeadNoteAction(lead!.id, noteBody);
      if (res.error) {
        setError(res.error);
        return;
      }
      setNoteBody("");
      router.refresh();
    });
  }

  const followUpValue = lead.next_follow_up_at
    ? lead.next_follow_up_at.slice(0, 16)
    : "";

  const convertedValue = lead.converted_vehicle_id ?? "__none__";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{lead.client_name}</SheetTitle>
          <SheetDescription>
            {lead.phone}
            {lead.client_email ? ` · ${lead.client_email}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <LeadStatusBadge status={lead.status} />
            <span className="text-xs text-muted-foreground">
              {formatDatePt(lead.created_at)}
              {lead.source
                ? ` · ${LEAD_SOURCE_LABELS[lead.source] ?? lead.source}`
                : ""}
            </span>
          </div>

          {lead.message ? (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              {lead.message}
            </div>
          ) : null}

          {lead.vehicles ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Veículo de interesse: </span>
              <Link
                href={`/veiculo/${lead.vehicles.id}`}
                className="font-medium text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {lead.vehicles.brand} {lead.vehicles.model}
              </Link>
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={`lead-status-${lead.id}`}>Status</Label>
            <Select
              value={lead.status}
              onValueChange={(value) => {
                const next = value as LeadPipelineStatus;
                if (next === "lost") {
                  runUpdate({
                    status: next,
                    lossReasonCode: lossReasonCode || lead.loss_reason_code,
                    lossReasonNote: lossReasonNote || lead.loss_reason_note,
                  });
                  return;
                }
                runUpdate({ status: next });
              }}
              disabled={pending}
            >
              <SelectTrigger id={`lead-status-${lead.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_PIPELINE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {LEAD_PIPELINE_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {lead.status === "lost" || lossReasonCode ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="space-y-2">
                <Label htmlFor={`lead-loss-reason-${lead.id}`}>Motivo da perda</Label>
                <Select
                  value={lossReasonCode || "__none__"}
                  onValueChange={(value) =>
                    setLossReasonCode(value === "__none__" ? "" : value)
                  }
                  disabled={pending}
                >
                  <SelectTrigger id={`lead-loss-reason-${lead.id}`}>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Selecione —</SelectItem>
                    {LEAD_LOSS_REASON_CODES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {LEAD_LOSS_REASON_LABELS[code]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {lossReasonCode === "other" ? (
                <div className="space-y-2">
                  <Label htmlFor={`lead-loss-note-${lead.id}`}>Detalhe do motivo</Label>
                  <Textarea
                    id={`lead-loss-note-${lead.id}`}
                    value={lossReasonNote}
                    onChange={(event) => setLossReasonNote(event.target.value)}
                    placeholder="Descreva o motivo da perda…"
                    rows={2}
                    disabled={pending}
                  />
                </div>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending || !lossReasonCode}
                onClick={() =>
                  runUpdate({
                    status: "lost",
                    lossReasonCode,
                    lossReasonNote,
                  })
                }
              >
                Salvar motivo da perda
              </Button>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={`lead-follow-up-${lead.id}`}>Próximo follow-up</Label>
            <Input
              id={`lead-follow-up-${lead.id}`}
              type="datetime-local"
              value={followUpValue}
              disabled={pending}
              onChange={(event) => {
                const value = event.target.value;
                runUpdate({
                  nextFollowUpAt: value ? new Date(value).toISOString() : null,
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`lead-won-vehicle-${lead.id}`}>
              Venda vinculada (veículo vendido)
            </Label>
            <Select
              value={convertedValue}
              onValueChange={(value) =>
                runUpdate({
                  convertedVehicleId: value === "__none__" ? null : value,
                })
              }
              disabled={pending}
            >
              <SelectTrigger id={`lead-won-vehicle-${lead.id}`}>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Nenhum —</SelectItem>
                {soldVehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lead.converted_vehicle_id ? (
              <Button variant="link" className="h-auto p-0 text-sm" asChild>
                <Link href={`/painel/estoque/${lead.converted_vehicle_id}`}>
                  Abrir ficha do veículo / recibo
                </Link>
              </Button>
            ) : null}
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground">Comentários</p>
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {(lead.notes ?? []).length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  Nenhum comentário ainda.
                </li>
              ) : (
                (lead.notes ?? []).map((note: LeadNoteItem) => (
                  <li
                    key={note.id}
                    className="rounded-md border border-border bg-card p-2 text-sm"
                  >
                    <p>{note.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDatePt(note.created_at)}
                    </p>
                  </li>
                ))
              )}
            </ul>
            <Textarea
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              placeholder="Registrar conversa, objeção ou próximo passo…"
              rows={3}
              disabled={pending}
            />
            <Button
              type="button"
              size="sm"
              disabled={pending || !noteBody.trim()}
              onClick={submitNote}
            >
              Adicionar comentário
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <LeadClaimButton
            leadId={lead.id}
            canClaim={viewerRole === "seller" && lead.assigned_user_id === null}
            size="default"
            className="w-full"
          />

          {canManageAssignments ? (
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={pending}
              onClick={handleDelete}
            >
              Excluir contato
            </Button>
          ) : null}

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" asChild>
            <a href={wa} target="_blank" rel="noopener noreferrer">
              Responder no WhatsApp
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
