"use client";

import { useActionState, useEffect } from "react";

import { pushAutopainelAnalyticsEvent } from "@autopainel/shared/lib/analytics/push-autopainel-analytics-event";

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
} from "@autopainel/shared/ui";

import {
  submitSaasProspectAction,
  type SubmitSaasProspectState,
} from "@/actions/submit-saas-prospect";
import { ConsentCheckboxGroup } from "@/components/consent-checkbox-group";

const initialState: SubmitSaasProspectState | null = null;

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitSaasProspectAction,
    initialState,
  );

  useEffect(() => {
    if (!state?.success) {
      return;
    }
    pushAutopainelAnalyticsEvent({
      ap_event: "lead_form_submit",
      ap_event_category: "conversion",
      ap_event_label: "marketing_contact",
      ap_app_surface: "marketing",
    });
  }, [state?.success]);

  return (
    <Card className="border-white/10 bg-card/80 shadow-xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-xl">Solicitar demonstração</CardTitle>
        <CardDescription>
          Preencha os dados abaixo. Nossa equipe retorna em até um dia útil.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state?.success ? (
          <div
            className="rounded-lg border border-marketing-accent/30 bg-marketing-accent/10 px-4 py-3 text-sm text-foreground"
            role="status"
          >
            Recebemos seu pedido. Em breve entraremos em contato pelo e-mail
            informado.
          </div>
        ) : (
          <form action={formAction} className="space-y-5">
            {state?.error ? (
              <div
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {state.error}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input
                id="full_name"
                name="full_name"
                autoComplete="name"
                placeholder="Seu nome"
                required
                minLength={2}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="voce@suaempresa.com.br"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="Opcional"
                maxLength={40}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Concessionária / empresa</Label>
              <Input
                id="company_name"
                name="company_name"
                autoComplete="organization"
                placeholder="Nome fantasia ou razão social"
                maxLength={200}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Quantos veículos costuma ter em estoque? Usa algum sistema hoje?"
                maxLength={10000}
                disabled={isPending}
              />
            </div>
            <ConsentCheckboxGroup disabled={isPending} />
            <Button
              type="submit"
              className="w-full bg-marketing-accent text-white hover:bg-marketing-accent/90"
              size="lg"
              disabled={isPending}
            >
              {isPending ? "Enviando…" : "Enviar pedido"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
