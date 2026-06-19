"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@autopainel/shared/ui";

import { StorefrontContactForm } from "@/components/storefront/storefront-contact-form";
import { useStorefrontThemeCssVars } from "@/components/storefront/use-storefront-theme-css-vars";
import { buildStorefrontWhatsAppUrl } from "@/lib/phone/build-storefront-whatsapp-url";

interface StorefrontWhatsAppLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealershipName: string;
  dealershipSlug: string;
  whatsappNumber: string;
  source: "whatsapp_float" | "vehicle_page";
  vehicleId?: string | null;
  campaign: string;
  content?: string;
  defaultWhatsAppMessage?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
}

export function StorefrontWhatsAppLeadDialog({
  open,
  onOpenChange,
  dealershipName,
  dealershipSlug,
  whatsappNumber,
  source,
  vehicleId = null,
  campaign,
  content,
  defaultWhatsAppMessage,
  title = "Falar no WhatsApp",
  description,
  submitLabel = "Continuar no WhatsApp",
}: StorefrontWhatsAppLeadDialogProps) {
  const themeCssVars = useStorefrontThemeCssVars();
  const dialogDescription =
    description ??
    `Preencha seus dados para abrir uma conversa com ${dealershipName}. Seus dados serão registrados para que a equipe possa te atender.`;

  function handleLeadSuccess(payload: {
    clientName: string;
    phone: string;
    message: string;
  }) {
    const intro =
      defaultWhatsAppMessage ??
      `Olá! Meu nome é ${payload.clientName}. Vim pelo site da ${dealershipName}.`;
    const composed = payload.message.trim()
      ? `${intro}\n\n${payload.message.trim()}`
      : intro;

    const href = buildStorefrontWhatsAppUrl({
      phone: whatsappNumber,
      message: composed,
      dealershipSlug,
      campaign,
      content,
    });

    onOpenChange(false);
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={themeCssVars}
        className="max-w-md border-[color-mix(in_srgb,var(--dealer-primary)_20%,transparent)] !bg-[var(--dealer-surface)] !text-[var(--dealer-fg)] [&>button]:text-[var(--dealer-fg)]/70 [&>button]:hover:text-[var(--dealer-fg)] [&>button]:focus:ring-[var(--dealer-primary)]"
      >
        <DialogHeader>
          <DialogTitle
            className="text-[var(--dealer-fg)]"
            style={{ fontFamily: "var(--dealer-font-heading)" }}
          >
            {title}
          </DialogTitle>
          <DialogDescription className="text-[var(--dealer-fg)]/70">
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <StorefrontContactForm
          dealershipName={dealershipName}
          source={source}
          vehicleId={vehicleId}
          submitLabel={submitLabel}
          showEmail={false}
          onSuccess={handleLeadSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
