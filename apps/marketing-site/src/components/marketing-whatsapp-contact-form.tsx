"use client";

import { useState } from "react";

import { pushAutopainelAnalyticsEvent } from "@autopainel/shared/lib/analytics/push-autopainel-analytics-event";

import {
  Button,
  Input,
  Label,
  Textarea,
} from "@autopainel/shared/ui";

import { submitSaasProspectAction } from "@/actions/submit-saas-prospect";
import { ConsentCheckboxGroup } from "@/components/consent-checkbox-group";

interface MarketingWhatsAppContactFormProps {
  onSuccess: () => void;
}

export function MarketingWhatsAppContactForm({
  onSuccess,
}: MarketingWhatsAppContactFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("lead_channel", "whatsapp_float");

    const result = await submitSaasProspectAction(null, formData);
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    pushAutopainelAnalyticsEvent({
      ap_event: "lead_form_submit",
      ap_event_category: "conversion",
      ap_event_label: "marketing_whatsapp_float",
      ap_app_surface: "marketing",
    });

    onSuccess();
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMessage ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="wa-full_name">Seu nome</Label>
        <Input id="wa-full_name" name="full_name" required autoComplete="name" disabled={isSubmitting} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="wa-email">E-mail</Label>
        <Input
          id="wa-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="wa-phone">WhatsApp / telefone</Label>
        <Input
          id="wa-phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="(13) 99743-5851"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="wa-company_name">Concessionária (opcional)</Label>
        <Input id="wa-company_name" name="company_name" autoComplete="organization" disabled={isSubmitting} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="wa-message">Mensagem (opcional)</Label>
        <Textarea id="wa-message" name="message" rows={3} disabled={isSubmitting} />
      </div>

      <ConsentCheckboxGroup disabled={isSubmitting} />

      <Button
        type="submit"
        className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a]"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enviando…" : "Enviar mensagem"}
      </Button>
    </form>
  );
}
