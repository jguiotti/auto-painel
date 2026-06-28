import type { Metadata } from "next";

import { LegalPageLayout } from "@/components/legal-page-layout";
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content";
import { LEGAL_SITE_URL, PRIVACY_POLICY_VERSION } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a AutoPainel trata dados pessoais de visitantes, prospects e usuários da plataforma — em conformidade com a LGPD.",
  alternates: { canonical: `${LEGAL_SITE_URL}/politica-de-privacidade` },
  robots: { index: true, follow: true },
};

export default function PoliticaDePrivacidadePage() {
  return (
    <LegalPageLayout
      title="Política de Privacidade"
      description="Transparência sobre coleta, uso e proteção de dados pessoais no site institucional e na plataforma AutoPainel."
      lastUpdated={PRIVACY_POLICY_VERSION}
    >
      <PrivacyPolicyContent />
    </LegalPageLayout>
  );
}
