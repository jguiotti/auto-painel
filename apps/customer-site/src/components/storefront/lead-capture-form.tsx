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
      setErrorMessage("Ajuste a simulação acima para recebermos sua proposta.");
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
      setSuccessMessage(
        "Perfeito! Nossa equipe vai entrar em contato em breve com as melhores condições para você.",
      );
      form.reset();
    }
  }

  return (
    <Card aria-labelledby="lead-form-title" className="border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_15%,transparent)]">
      <CardHeader>
        <CardTitle
          id="lead-form-title"
          className="text-[var(--primary-color,var(--dealer-primary))]"
        >
          {requireSimulation ? "Garanta sua proposta de financiamento" : "Quero saber mais sobre este carro"}
        </CardTitle>
        <CardDescription>
          {requireSimulation
            ? "Envie seus dados e receba retorno rápido com condições pensadas para você."
            : "Deixe seu contato e fale direto com um consultor da loja."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="vehicle_id" value={vehicleId} />

          {requireSimulation ? (
            <div className="rounded-lg border border-[color-mix(in_srgb,var(--secondary-color,var(--dealer-accent))_35%,transparent)] bg-[color-mix(in_srgb,var(--secondary-color,var(--dealer-accent))_8%,transparent)] p-4 text-sm leading-relaxed text-[var(--storefront-fg,var(--dealer-fg))]/85">
              Você está a um passo de levar este carro para casa. Confirmamos sua simulação e
              preparamos uma proposta sem compromisso.
            </div>
          ) : (
            <fieldset className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <legend className="mb-1 text-sm font-medium text-[var(--storefront-fg,var(--dealer-fg))]">
                Como podemos ajudar?
              </legend>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_15%,transparent)] px-3 py-2 text-sm has-[:checked]:border-[var(--secondary-color,var(--dealer-accent))] has-[:checked]:bg-[color-mix(in_srgb,var(--secondary-color,var(--dealer-accent))_10%,transparent)]">
                <input
                  type="radio"
                  name="lead_type_ui"
                  checked={leadType === "contact"}
                  onChange={() => setLeadType("contact")}
                />
                Quero comprar este veículo
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_15%,transparent)] px-3 py-2 text-sm has-[:checked]:border-[var(--secondary-color,var(--dealer-accent))] has-[:checked]:bg-[color-mix(in_srgb,var(--secondary-color,var(--dealer-accent))_10%,transparent)]">
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
            <Label htmlFor="lead-name">Seu nome</Label>
            <Input
              id="lead-name"
              name="client_name"
              required
              autoComplete="name"
              placeholder="Como podemos te chamar?"
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
            size="lg"
            className="bg-[var(--secondary-color,var(--dealer-accent))] text-base font-semibold text-white hover:opacity-95"
          >
            {isSubmitting
              ? "Enviando…"
              : requireSimulation
                ? "Quero minha proposta agora"
                : "Falar com a loja agora"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
