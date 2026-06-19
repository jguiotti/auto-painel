"use client";

import { useEffect, useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@autopainel/shared/ui";

import { MarketingWhatsAppContactForm } from "@/components/marketing-whatsapp-contact-form";

interface MarketingWhatsAppLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarketingWhatsAppLeadDialog({
  open,
  onOpenChange,
}: MarketingWhatsAppLeadDialogProps) {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) {
      setSubmitted(false);
    }
  }, [open]);

  function handleLeadSuccess() {
    setSubmitted(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-zinc-900 text-zinc-100">
        {submitted ? (
          <>
            <DialogHeader>
              <DialogTitle>Mensagem recebida</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Registramos seu interesse. Nossa equipe comercial entrará em contato pelo
                WhatsApp em breve.
              </DialogDescription>
            </DialogHeader>
            <Button
              type="button"
              className="w-full"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Falar no WhatsApp</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Preencha seus dados para registrarmos seu interesse. Nossa equipe retorna pelo
                WhatsApp informado.
              </DialogDescription>
            </DialogHeader>
            <MarketingWhatsAppContactForm onSuccess={handleLeadSuccess} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
