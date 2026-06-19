"use client";

import { useState } from "react";

import {
  Button,
  Input,
  Label,
  Textarea,
} from "@autopainel/shared/ui";

import { submitPublicLeadAction } from "@/app/actions/public-lead";
import { StorefrontConsentFields } from "@/components/storefront/storefront-consent-fields";

const storefrontFieldClassName =
  "border-[color-mix(in_srgb,var(--dealer-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--dealer-bg)_88%,black)] text-[var(--dealer-fg)] placeholder:text-[var(--dealer-fg)]/45 shadow-none focus-visible:ring-[var(--dealer-primary)]";

const storefrontLabelClassName = "text-[var(--dealer-fg)]";

interface StorefrontContactFormProps {
  dealershipName: string;
  source: "contact_page" | "whatsapp_float" | "vehicle_page";
  vehicleId?: string | null;
  onSuccess?: (payload: { clientName: string; phone: string; message: string }) => void;
  submitLabel?: string;
  showEmail?: boolean;
  showMessage?: boolean;
}

export function StorefrontContactForm({
  dealershipName,
  source,
  vehicleId = null,
  onSuccess,
  submitLabel = "Enviar mensagem",
  showEmail = true,
  showMessage = true,
}: StorefrontContactFormProps) {
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
    formData.set("type", "contact");
    formData.set("source", source);
    if (vehicleId) {
      formData.set("vehicle_id", vehicleId);
    }

    const result = await submitPublicLeadAction(formData);
    setIsSubmitting(false);

    if (result && "error" in result && result.error) {
      setErrorMessage(result.error);
      return;
    }

    if (result && "success" in result && result.success) {
      const clientName = String(formData.get("client_name") ?? "").trim();
      const phone = String(formData.get("phone") ?? "").trim();
      const message = String(formData.get("message") ?? "").trim();
      setSuccessMessage("Recebemos seu contato. Em breve nossa equipe retorna.");
      onSuccess?.({ clientName, phone, message });
      form.reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="contact-name" className={storefrontLabelClassName}>
          Seu nome
        </Label>
        <Input
          id="contact-name"
          name="client_name"
          required
          autoComplete="name"
          className={storefrontFieldClassName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-phone" className={storefrontLabelClassName}>
          WhatsApp / telefone
        </Label>
        <Input
          id="contact-phone"
          name="phone"
          required
          type="tel"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          className={storefrontFieldClassName}
        />
      </div>

      {showEmail ? (
        <div className="space-y-2">
          <Label htmlFor="contact-email" className={storefrontLabelClassName}>
            E-mail (opcional)
          </Label>
          <Input
            id="contact-email"
            name="client_email"
            type="email"
            autoComplete="email"
            className={storefrontFieldClassName}
          />
        </div>
      ) : null}

      {showMessage ? (
        <div className="space-y-2">
          <Label htmlFor="contact-message" className={storefrontLabelClassName}>
            Mensagem
          </Label>
          <Textarea
            id="contact-message"
            name="message"
            rows={4}
            placeholder="Conte o que você procura ou como podemos ajudar."
            className={storefrontFieldClassName}
          />
        </div>
      ) : null}

      <StorefrontConsentFields dealershipName={dealershipName} disabled={isSubmitting} />

      {errorMessage ? (
        <p className="text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="text-sm font-medium text-emerald-400">{successMessage}</p>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-[var(--dealer-accent)] text-white hover:opacity-95"
      >
        {isSubmitting ? "Enviando…" : submitLabel}
      </Button>
    </form>
  );
}
