"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@autopainel/shared/ui";

const PANEL_ONBOARDING_COOKIE = "ap_panel_onboarding_v1";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

interface PanelOnboardingStep {
  title: string;
  description: string;
  href?: string;
  hrefLabel?: string;
}

const STEPS: PanelOnboardingStep[] = [
  {
    title: "Bem-vindo ao painel",
    description:
      "Este é o centro de operação da sua concessionária: estoque, contatos da vitrine e dados da loja ficam aqui.",
  },
  {
    title: "Cadastre seu estoque",
    description:
      "Publique veículos com fotos e preço. A vitrine pública só exibe o que estiver ativo no estoque.",
    href: "/painel/estoque",
    hrefLabel: "Ir para estoque",
  },
  {
    title: "Acompanhe os contatos",
    description:
      "Leads da vitrine e cadastros manuais aparecem em Contatos. Atribua vendedores e registre follow-ups.",
    href: "/painel/contatos",
    hrefLabel: "Ver contatos",
  },
  {
    title: "Configure a vitrine",
    description:
      "Revise WhatsApp, e-mail e endereço exibidos na página de contato da sua loja online.",
    href: "/painel/loja",
    hrefLabel: "Dados da loja",
  },
];

function hasOnboardingCookie(): boolean {
  if (typeof document === "undefined") {
    return true;
  }
  return document.cookie.split(";").some((entry) => {
    const trimmed = entry.trim();
    return trimmed === `${PANEL_ONBOARDING_COOKIE}=1` || trimmed.startsWith(`${PANEL_ONBOARDING_COOKIE}=1;`);
  });
}

function persistOnboardingCookie() {
  document.cookie = `${PANEL_ONBOARDING_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function PanelOnboardingWizard() {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!hasOnboardingCookie()) {
      setOpen(true);
    }
  }, []);

  function finishWizard() {
    persistOnboardingCookie();
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      finishWizard();
      return;
    }
    setOpen(nextOpen);
  }

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex >= STEPS.length - 1;

  if (!step) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Passo {stepIndex + 1} de {STEPS.length}
        </p>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={finishWizard}>
            Pular tour
          </Button>
          <div className="flex flex-wrap gap-2">
            {step.href && step.hrefLabel ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={step.href}>{step.hrefLabel}</Link>
              </Button>
            ) : null}
            {isLastStep ? (
              <Button type="button" size="sm" onClick={finishWizard}>
                Começar a usar
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setStepIndex((current) => current + 1)}
              >
                Próximo
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
