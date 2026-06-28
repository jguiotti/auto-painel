import type { Metadata } from "next";

import { TrialAdhesionTermContent } from "@/components/legal/trial-adhesion-term-content";
import { LEGAL_SITE_URL } from "@/lib/legal/constants";
import { TRIAL_DURATION_DAYS } from "@/lib/legal/trial-constants";

export const metadata: Metadata = {
  title: "Termo de Adesão ao Trial",
  description: `Condições do trial gratuito de ${TRIAL_DURATION_DAYS} dias no plano Essencial AutoPainel.`,
  alternates: { canonical: `${LEGAL_SITE_URL}/termo-adesao-trial` },
};

export default function TermoAdesaoTrialPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 prose prose-invert prose-zinc">
      <h1>Termo de Adesão ao Trial — Plano Essencial AutoPainel</h1>
      <TrialAdhesionTermContent />
    </article>
  );
}
