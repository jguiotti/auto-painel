"use client";

import {
  buildPlatformSupportWhatsAppUrl,
  buildWhatsAppUrlWithDigits,
  resolvePlatformSupportWhatsAppDigits,
} from "@autopainel/shared/lib/growth-operations/platform-support-whatsapp";
import { Button } from "@autopainel/shared/ui";
import { Mail, MessageCircle } from "lucide-react";

interface ContactQuickActionsProps {
  email?: string | null;
  phone?: string | null;
  label?: string | null;
  whatsappMessage?: string | null;
}

export function ContactQuickActions({
  email,
  phone,
  label,
  whatsappMessage,
}: ContactQuickActionsProps) {
  const trimmedEmail = email?.trim();
  const trimmedPhone = phone?.trim();
  const whatsappDigits = trimmedPhone ? trimmedPhone.replace(/\D/g, "") : "";
  const defaultMessage = whatsappMessage?.trim()
    ? whatsappMessage.trim()
    : label
      ? `Olá! Preciso falar sobre ${label}.`
      : "Olá! Preciso falar com a equipe AutoPainel.";
  const whatsappUrl =
    whatsappDigits.length >= 10
      ? buildWhatsAppUrlWithDigits(whatsappDigits, defaultMessage)
      : buildPlatformSupportWhatsAppUrl(defaultMessage);

  return (
    <div className="flex flex-wrap gap-2">
      {trimmedEmail ? (
        <Button variant="outline" size="sm" asChild>
          <a href={`mailto:${trimmedEmail}`}>
            <Mail className="mr-2 size-4" />
            E-mail
          </a>
        </Button>
      ) : null}
      <Button variant="outline" size="sm" asChild>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="mr-2 size-4" />
          WhatsApp
        </a>
      </Button>
      <span className="sr-only">WhatsApp oficial {resolvePlatformSupportWhatsAppDigits()}</span>
    </div>
  );
}
