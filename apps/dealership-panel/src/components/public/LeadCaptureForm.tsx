"use client";

import { useState } from "react";

import { submitPublicLeadAction } from "@/app/(public)/actions";
import type { FinanceSimulationSnapshot } from "@/types/finance-simulation";

interface LeadCaptureFormProps {
  vehicleId: string;
  simulationSnapshot: FinanceSimulationSnapshot | null;
}

export function LeadCaptureForm({
  vehicleId,
  simulationSnapshot,
}: LeadCaptureFormProps) {
  const [leadType, setLeadType] = useState<"contact" | "simulation">("contact");
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
    formData.set("vehicle_id", vehicleId);
    formData.set("type", leadType);

    if (leadType === "simulation" && simulationSnapshot) {
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
    <section
      className="rounded-xl border border-black/5 bg-[var(--dealer-surface)] p-5 shadow-sm dark:border-white/10"
      aria-labelledby="lead-form-title"
    >
      <h2
        id="lead-form-title"
        className="text-lg font-semibold text-[var(--dealer-primary)]"
      >
        Fale com a loja
      </h2>
      <p className="mt-1 text-sm text-[var(--dealer-fg)]/70">
        Deixe seus dados para retorno por telefone ou WhatsApp.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="vehicle_id" value={vehicleId} />

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

        <div>
          <label
            htmlFor="lead-name"
            className="block text-sm font-medium text-[var(--dealer-fg)]"
          >
            Nome
          </label>
          <input
            id="lead-name"
            name="client_name"
            required
            autoComplete="name"
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label
            htmlFor="lead-phone"
            className="block text-sm font-medium text-[var(--dealer-fg)]"
          >
            WhatsApp / telefone
          </label>
          <input
            id="lead-phone"
            name="phone"
            required
            type="tel"
            autoComplete="tel"
            placeholder="(11) 99999-9999"
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 items-center justify-center rounded-lg bg-[var(--dealer-primary)] text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Enviando…" : "Enviar"}
        </button>
      </form>
    </section>
  );
}
