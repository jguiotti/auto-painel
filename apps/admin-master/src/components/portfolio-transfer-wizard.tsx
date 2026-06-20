"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  toast,
} from "@autopainel/shared/ui";

import { transferSalesRepPortfolioAction } from "@/actions/platform-sales-portfolio";
import type { PlatformSalesAttributionListRow } from "@/lib/data/platform-sales-squad-shared";
import type { PlatformSalesRepListRow } from "@/lib/data/platform-sales-squad-shared";

interface PortfolioTransferWizardProps {
  fromRep: PlatformSalesRepListRow;
  activeReps: PlatformSalesRepListRow[];
  attributions: PlatformSalesAttributionListRow[];
}

export function PortfolioTransferWizard({
  fromRep,
  activeReps,
  attributions,
}: PortfolioTransferWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toRepId, setToRepId] = useState("");
  const [effectiveAt, setEffectiveAt] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [selectedDealerships, setSelectedDealerships] = useState<string[]>(
    attributions.filter((row) => row.status === "confirmed").map((row) => row.dealership_id),
  );
  const [confirmed, setConfirmed] = useState(false);
  const [notes, setNotes] = useState("");

  const confirmedAttributions = attributions.filter((row) => row.status === "confirmed");
  const destinationOptions = activeReps.filter((rep) => rep.id !== fromRep.id);

  function toggleDealership(dealershipId: string, checked: boolean) {
    setSelectedDealerships((current) =>
      checked
        ? [...current, dealershipId]
        : current.filter((id) => id !== dealershipId),
    );
  }

  function handleSubmit() {
    if (!toRepId) {
      setError("Selecione o representante de destino.");
      return;
    }
    if (!confirmed) {
      setError("Confirme que deseja repassar a carteira.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("from_sales_rep_id", fromRep.id);
    formData.set("to_sales_rep_id", toRepId);
    formData.set("effective_at", effectiveAt);
    formData.set("dealership_ids", selectedDealerships.join(","));
    formData.set("notes", notes);

    startTransition(async () => {
      const result = await transferSalesRepPortfolioAction(formData);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(
        `Carteira repassada — ${result.result?.dealerships_moved ?? 0} loja(s) movida(s).`,
      );
      router.push(`/painel/equipe/comercial/${fromRep.id}`);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repasse de carteira</CardTitle>
        <CardDescription>
          Transferir lojas confirmadas de {fromRep.full_name} para outro representante ativo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 text-sm">
          {[1, 2, 3].map((value) => (
            <span
              key={value}
              className={`rounded-full px-3 py-1 ${
                step === value ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              Passo {value}
            </span>
          ))}
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Representante de origem</Label>
              <Input value={fromRep.full_name} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to_sales_rep_id">Representante de destino</Label>
              <select
                id="to_sales_rep_id"
                value={toRepId}
                onChange={(event) => setToRepId(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione…</option>
                {destinationOptions.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.full_name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" onClick={() => setStep(2)} disabled={!toRepId}>
              Continuar
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="effective_at">Data de início do repasse</Label>
              <Input
                id="effective_at"
                type="datetime-local"
                value={effectiveAt}
                onChange={(event) => setEffectiveAt(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Lojas a transferir</Label>
              {confirmedAttributions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma loja confirmada na carteira.
                </p>
              ) : (
                <div className="space-y-2 rounded-md border p-3">
                  {confirmedAttributions.map((row) => (
                    <label key={row.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedDealerships.includes(row.dealership_id)}
                        onChange={(event) =>
                          toggleDealership(row.dealership_id, event.target.checked)
                        }
                        className="size-4 rounded border border-input"
                      />
                      {row.dealership_name}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Continuar
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p>
                <strong>Origem:</strong> {fromRep.full_name}
              </p>
              <p>
                <strong>Destino:</strong>{" "}
                {destinationOptions.find((rep) => rep.id === toRepId)?.full_name ?? "—"}
              </p>
              <p>
                <strong>Lojas:</strong> {selectedDealerships.length}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
              />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5 size-4 rounded border border-input"
              />
              Confirmo o repasse de carteira conforme resumo acima.
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button type="button" disabled={pending} onClick={handleSubmit}>
                {pending ? "Repassando…" : "Confirmar repasse"}
              </Button>
              <Button type="button" variant="ghost" asChild>
                <Link href={`/painel/equipe/comercial/${fromRep.id}`}>Cancelar</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
