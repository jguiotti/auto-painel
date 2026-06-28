import type { Metadata } from "next";

import { LegalPageLayout } from "@/components/legal-page-layout";
import { TermsOfUseContent } from "@/components/legal/terms-of-use-content";
import { LEGAL_SITE_URL, PRIVACY_POLICY_VERSION } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Termos de uso do site institucional e da plataforma SaaS AutoPainel para concessionárias.",
  alternates: { canonical: `${LEGAL_SITE_URL}/termos-de-uso` },
  robots: { index: true, follow: true },
};

export default function TermosDeUsoPage() {
  return (
    <LegalPageLayout
      title="Termos de Uso"
      description="Condições gerais de acesso ao site e contratação da plataforma AutoPainel."
      lastUpdated={PRIVACY_POLICY_VERSION}
    >
      <TermsOfUseContent />
    </LegalPageLayout>
  );
}
