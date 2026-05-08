"use client";

import { useState } from "react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";
import { Input } from "@autopainel/shared/ui";
import { Label } from "@autopainel/shared/ui";

import { submitPublicLeadAction } from "@/app/actions/public-lead";
import type { FinanceSimulationSnapshot } from "@/types/finance-simulation";

interface LeadCaptureFormProps {
  vehicleId: string;
  simulationSnapshot: FinanceSimulationSnapshot | null;
  requireSimulation?: boolean;
}

export function LeadCaptureForm({
  vehicleId,
  simulationSnapshot,
  requireSimulation = false,
}: LeadCaptureFormProps) {
  const [leadType, setLeadType] = useState<"contact" | "simulation">(
    requireSimulation ? "simulation" : "contact",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const effectiveType = requireSimulation ? "simulation" : leadType;

    if (effectiveType === "simulation" && !simulationSnapshot) {
      setIsSubmitting(false);
      setErrorMessage("Faça a simulação antes de enviar seus dados.");
      return;
    }

    formData.set("vehicle_id", vehicleId);
    formData.set("type", effectiveType);

    if (effectiveType === "simulation" && simulationSnapshot) {
      formData.set("simulation_data", JSON.stringify(simulationSnapshot));
    } else {
      formData.set("simulation_data", "");
    }

    const result = await submitPublicLeadAction(formData);
    setIsSubmitting(false);

    if (result && "error" in result && result.error) {
      setErrorMessage(result.error);
      return;
    }

    if (result && "success" in result && result.success) {
      setSuccessMessage("Recebemos seu contato! Em breve a loja retorna.");
      form.reset();
    }
  }

  return (
    <Card aria-labelledby="lead-form-title">
      <CardHeader>
        <CardTitle
          id="lead-form-title"
          className="text-[var(--dealer-primary)]"
        >
          Fale com a loja
        </CardTitle>
        <CardDescription>
          {requireSimulation
            ? "Conclua a simulação e envie seus dados para receber retorno da loja."
            : "Deixe seus dados para retorno por telefone ou WhatsApp."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="vehicle_id" value={vehicleId} />

          {requireSimulation ? (
            <div className="rounded-md border border-[var(--dealer-primary)]/20 bg-[var(--dealer-bg)] p-3 text-sm text-[var(--dealer-fg)]/80">
              Envio de lead qualificado por simulação.
            </div>
          ) : (
            <fieldset className="flex flex-wrap gap-4">
              <legend className="sr-only">Tipo de interesse</legend>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="lead_type_ui"
                  checked={leadType === "contact"}
                  onChange={() => setLeadType("contact")}
                />
                Tenho interesse neste veículo
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="lead_type_ui"
                  checked={leadType === "simulation"}
                  onChange={() => setLeadType("simulation")}
                />
                Quero simular o financiamento
              </label>
            </fieldset>
          )}

          <div className="space-y-2">
            <Label htmlFor="lead-name">Nome</Label>
            <Input
              id="lead-name"
              name="client_name"
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-phone">WhatsApp / telefone</Label>
            <Input
              id="lead-phone"
              name="phone"
              required
              type="tel"
              autoComplete="tel"
              placeholder="(11) 99999-9999"
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {successMessage}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[var(--dealer-primary)] text-white hover:opacity-95"
          >
            {isSubmitting
              ? "Enviando…"
              : requireSimulation
                ? "Enviar simulação"
                : "Enviar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
