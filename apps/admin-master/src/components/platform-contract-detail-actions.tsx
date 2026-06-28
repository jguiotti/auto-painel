"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmActionDialog } from "@autopainel/shared/ui";
import { Button, Input, Label } from "@autopainel/shared/ui";

import {
  markPlatformContractAcceptedManuallyAction,
  markPlatformContractSignedAction,
  sendPlatformContractForAcceptanceAction,
  updatePlatformContractDraftAction,
} from "@/actions/platform-contracts";
import {
  PLATFORM_CONTRACT_STATUS_LABELS,
  type PlatformContractRow,
} from "@/lib/data/platform-contracts-shared";
import type { DealershipAdminRow } from "@/types/dealership-admin";
import type { PlatformSalesRepListRow } from "@/lib/data/platform-sales-squad-shared";

interface PlatformContractDetailActionsProps {
  contract: PlatformContractRow;
  salesReps: PlatformSalesRepListRow[];
  dealerships: DealershipAdminRow[];
}

function isPendingAcceptance(status: string): boolean {
  return status === "sent_for_acceptance" || status === "sent_for_signature";
}

function isAccepted(status: string): boolean {
  return status === "accepted" || status === "signed";
}

export function PlatformContractDetailActions({
  contract,
  salesReps,
  dealerships,
}: PlatformContractDetailActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [manualReference, setManualReference] = useState("");
  const [signatureRef, setSignatureRef] = useState("");
  const [salesRepId, setSalesRepId] = useState("");
  const [dealershipId, setDealershipId] = useState(contract.dealership_id ?? "");
  const [isPending, startTransition] = useTransition();

  function saveReviewNotes(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = await updatePlatformContractDraftAction(contract.id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function sendForAcceptance() {
    startTransition(async () => {
      setError(null);
      setSuccess(null);
      const result = await sendPlatformContractForAcceptanceAction(contract.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.emailSent) {
        setSuccess(`Link de aceite enviado para ${contract.counterparty_email}.`);
      } else {
        setSuccess(
          result.emailError
            ? `Link gerado, mas o e-mail falhou: ${result.emailError}`
            : "Link gerado, mas o e-mail não foi enviado.",
        );
      }
      router.refresh();
    });
  }

  function markAcceptedManually() {
    startTransition(async () => {
      setError(null);
      const result = await markPlatformContractAcceptedManuallyAction(
        contract.id,
        manualReference,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function markSignedLegacy() {
    startTransition(async () => {
      setError(null);
      const result = await markPlatformContractSignedAction(contract.id, signatureRef, {
        salesRepId: salesRepId || null,
        dealershipId: dealershipId || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
          {success}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Status:{" "}
        <strong>
          {PLATFORM_CONTRACT_STATUS_LABELS[contract.status] ?? contract.status}
        </strong>
      </p>

      {contract.status === "draft" ? (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveReviewNotes(new FormData(event.currentTarget));
            }}
            className="space-y-2"
          >
            <Label htmlFor="review_notes">Notas internas (opcional)</Label>
            <textarea
              id="review_notes"
              name="review_notes"
              rows={3}
              defaultValue={contract.review_notes ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button type="submit" variant="outline" size="sm" disabled={isPending}>
              Salvar notas
            </Button>
          </form>

          <ConfirmActionDialog
            title="Enviar link de aceite?"
            description="O texto do contrato será congelado. O titular receberá um e-mail com link para aceite triplo."
            confirmLabel="Enviar link de aceite"
            onConfirm={sendForAcceptance}
            trigger={
              <Button disabled={isPending}>Enviar link de aceite</Button>
            }
          />
        </>
      ) : null}

      {isPendingAcceptance(contract.status) ? (
        <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">
            Aguardando aceite online do cliente. Você pode reenviar o link ou registrar aceite
            manual com evidência documentada.
          </p>
          <Button variant="outline" disabled={isPending} onClick={sendForAcceptance}>
            Reenviar link de aceite
          </Button>

          <div className="space-y-2">
            <Label htmlFor="manual_reference">Registrar aceite manual</Label>
            <Input
              id="manual_reference"
              value={manualReference}
              onChange={(event) => setManualReference(event.target.value)}
              placeholder="ID ou referência do aceite (opcional)"
            />
            <Button variant="secondary" disabled={isPending} onClick={markAcceptedManually}>
              Registrar aceite manual
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="mb-2 text-xs text-muted-foreground">
              Fluxo legado com vínculo comercial automático (contratos antigos):
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="signature_ref">Referência</Label>
                <Input
                  id="signature_ref"
                  value={signatureRef}
                  onChange={(event) => setSignatureRef(event.target.value)}
                  placeholder="Referência offline"
                />
              </div>
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="contract_sales_rep_id">Representante comercial</Label>
                <select
                  id="contract_sales_rep_id"
                  value={salesRepId}
                  onChange={(event) => setSalesRepId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Sem vínculo automático</option>
                  {salesReps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="contract_dealership_id">Concessionária</Label>
                <select
                  id="contract_dealership_id"
                  value={dealershipId}
                  onChange={(event) => setDealershipId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione…</option>
                  {dealerships.map((dealership) => (
                    <option key={dealership.id} value={dealership.id}>
                      {dealership.name} ({dealership.slug})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              className="mt-3"
              onClick={markSignedLegacy}
              disabled={isPending || signatureRef.trim().length < 2}
            >
              Marcar aceite (legado + comercial)
            </Button>
          </div>
        </div>
      ) : null}

      {isAccepted(contract.status) ? (
        <p className="text-sm text-muted-foreground">
          Aceite confirmado
          {contract.signed_at
            ? ` em ${new Date(contract.signed_at).toLocaleString("pt-BR")}.`
            : "."}
        </p>
      ) : null}
    </div>
  );
}
