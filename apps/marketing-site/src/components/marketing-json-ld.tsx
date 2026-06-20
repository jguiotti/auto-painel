import { LEGAL_SITE_URL } from "@/lib/legal/constants";
import { BRAND_SOCIAL_LINKS } from "@/lib/brand";

interface MarketingJsonLdProps {
  pathname?: string;
}

export function MarketingJsonLd({ pathname = "/" }: MarketingJsonLdProps) {
  const pageUrl = `${LEGAL_SITE_URL}${pathname === "/" ? "" : pathname}`;

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AutoPainel",
    url: LEGAL_SITE_URL,
    logo: `${LEGAL_SITE_URL}/logo-autopainel-horizontal.png`,
    sameAs: [BRAND_SOCIAL_LINKS.facebook, BRAND_SOCIAL_LINKS.instagram],
    description:
      "Plataforma SaaS brasileira para gestão digital de concessionárias e revendedoras de veículos.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: "contato@autopainel.com.br",
      availableLanguage: ["Portuguese"],
    },
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AutoPainel",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: pageUrl,
    description:
      "Site whitelabel, estoque, leads e integrações para concessionárias — sem depender de agência.",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice: "197",
      highPrice: "997",
      offerCount: "3",
      description:
        "Planos Essencial, Profissional e Completo a partir de R$ 197/mês. Setup único obrigatório R$ 497.",
      url: `${LEGAL_SITE_URL}/planos`,
    },
    provider: {
      "@type": "Organization",
      name: "AutoPainel",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
    </>
  );
}
