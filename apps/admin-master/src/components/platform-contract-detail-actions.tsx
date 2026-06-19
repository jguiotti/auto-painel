"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmActionDialog } from "@autopainel/shared/ui";
import { Button, Input, Label } from "@autopainel/shared/ui";

import {
  sendPlatformContractForSignatureAction,
  markPlatformContractSignedAction,
  updatePlatformContractDraftAction,
} from "@/actions/platform-contracts";
import {
  PLATFORM_CONTRACT_STATUS_LABELS,
  type PlatformContractRow,
} from "@/lib/data/platform-contracts-shared";

interface PlatformContractDetailActionsProps {
  contract: PlatformContractRow;
}

export function PlatformContractDetailActions({
  contract,
}: PlatformContractDetailActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [signatureRef, setSignatureRef] = useState("");
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

  function sendForSignature() {
    startTransition(async () => {
      setError(null);
      const result = await sendPlatformContractForSignatureAction(contract.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function markSigned() {
    startTransition(async () => {
      setError(null);
      const result = await markPlatformContractSignedAction(contract.id, signatureRef);
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

      <p className="text-sm text-muted-foreground">
        Status: <strong>{PLATFORM_CONTRACT_STATUS_LABELS[contract.status]}</strong>
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
            <Label htmlFor="review_notes">Notas de revisão</Label>
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
            title="Enviar para assinatura?"
            description="O texto do contrato será congelado. Alterações futuras exigem aditivo."
            confirmLabel="Enviar"
            onConfirm={sendForSignature}
            trigger={
              <Button disabled={isPending}>Enviar para assinatura</Button>
            }
          />
        </>
      ) : null}

      {contract.status === "sent_for_signature" ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="signature_ref">Referência do provedor (Clicksign, etc.)</Label>
            <Input
              id="signature_ref"
              value={signatureRef}
              onChange={(event) => setSignatureRef(event.target.value)}
              placeholder="ID do envelope"
            />
          </div>
          <Button onClick={markSigned} disabled={isPending || signatureRef.trim().length < 2}>
            Marcar como assinado
          </Button>
        </div>
      ) : null}
    </div>
  );
}
