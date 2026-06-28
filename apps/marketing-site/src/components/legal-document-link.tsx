"use client";

import { useState, type ReactNode } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollArea,
} from "@autopainel/shared/ui";

import { LEGAL_PROSE_CLASS } from "@/components/legal/legal-prose-class";
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content";
import { TermsOfUseContent } from "@/components/legal/terms-of-use-content";
import { TrialAdhesionTermContent } from "@/components/legal/trial-adhesion-term-content";
import { PRIVACY_POLICY_VERSION, PLATFORM_TERMS_VERSION } from "@/lib/legal/constants";
import { TRIAL_ADHESION_VERSION } from "@/lib/legal/trial-constants";

export type LegalDocumentKind = "trial-adhesion" | "platform-terms" | "privacy-policy";

const LEGAL_DOCUMENT_META: Record<
  LegalDocumentKind,
  { title: string; description: string; version?: string }
> = {
  "trial-adhesion": {
    title: "Termo de Adesão ao Trial",
    description: "Condições do trial gratuito no plano Essencial AutoPainel.",
    version: TRIAL_ADHESION_VERSION,
  },
  "platform-terms": {
    title: "Termos de Uso",
    description: "Condições gerais de acesso ao site e contratação da plataforma AutoPainel.",
    version: PLATFORM_TERMS_VERSION,
  },
  "privacy-policy": {
    title: "Política de Privacidade",
    description: "Como a AutoPainel trata dados pessoais em conformidade com a LGPD.",
    version: PRIVACY_POLICY_VERSION,
  },
};

function LegalDocumentBody({ document }: { document: LegalDocumentKind }) {
  if (document === "trial-adhesion") {
    return <TrialAdhesionTermContent showBackLink={false} />;
  }
  if (document === "platform-terms") {
    return <TermsOfUseContent />;
  }
  return <PrivacyPolicyContent />;
}

interface LegalDocumentLinkProps {
  document: LegalDocumentKind;
  children: ReactNode;
  className?: string;
}

export function LegalDocumentLink({
  document,
  children,
  className = "text-marketing-accent hover:underline",
}: LegalDocumentLinkProps) {
  const [open, setOpen] = useState(false);
  const meta = LEGAL_DOCUMENT_META[document];

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {children}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 border-white/10 bg-zinc-950 p-0">
          <DialogHeader className="space-y-1 border-b border-white/10 px-6 py-4 text-left">
            <DialogTitle className="text-white">{meta.title}</DialogTitle>
            <DialogDescription>
              {meta.description}
              {meta.version ? ` Versão ${meta.version}.` : null}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[min(70vh,720px)] px-6 py-4">
            <div className={LEGAL_PROSE_CLASS}>
              <LegalDocumentBody document={document} />
            </div>
          </ScrollArea>

          <DialogFooter className="border-t border-white/10 px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Fechar e voltar ao formulário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
