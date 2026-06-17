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
      "@type": "Offer",
      priceCurrency: "BRL",
      price: "0",
      description: "Planos sob consulta — solicite demonstração",
      url: `${LEGAL_SITE_URL}/contato`,
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
