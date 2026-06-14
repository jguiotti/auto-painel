import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import { MarketingJsonLd } from "@/components/marketing-json-ld";
import { PlansModuleTable } from "@/components/plans-module-table";
import { BRAND_SLOGAN } from "@/lib/brand";
import { LEGAL_SITE_URL } from "@/lib/legal/constants";
import { fetchPublicPricingCatalog } from "@/lib/public-pricing-catalog";

export const metadata: Metadata = {
  title: "Planos e módulos",
  description:
    "Compare planos Starter, Business e Enterprise do AutoPainel. Módulos de estoque, financiamento, integrações OLX, WebMotors, Meta e mais — sob consulta.",
  alternates: { canonical: `${LEGAL_SITE_URL}/planos` },
  openGraph: {
    title: "Planos e módulos | AutoPainel",
    description:
      "Escolha o plano ideal para sua concessionária. Valores sob consulta.",
    url: `${LEGAL_SITE_URL}/planos`,
  },
};

const FAQ_ITEMS = [
  {
    question: "Quanto custa o AutoPainel?",
    answer:
      "Os planos são sob consulta, de acordo com o porte da loja e módulos contratados. Solicite uma demonstração para receber proposta personalizada.",
  },
  {
    question: "Preciso de agência para manter o site?",
    answer:
      "Não. Sua equipe atualiza estoque e vitrine direto no painel, com a marca da concessionária.",
  },
  {
    question: "Quais portais integra?",
    answer:
      "OLX, WebMotors e iCarros (conforme plano Enterprise e homologação). Redes sociais via Meta (Facebook e Instagram Business).",
  },
];

export default async function PlanosPage() {
  const catalog = await fetchPublicPricingCatalog();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <MarketingJsonLd pathname="/planos" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="font-slogan text-sm text-marketing-accent">{BRAND_SLOGAN}</p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Planos e módulos
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Monte a operação digital da sua loja com o que faz sentido hoje — e evolua quando
            precisar. Todos os valores são <strong className="text-zinc-300">sob consulta</strong>.
          </p>
        </div>

        <div className="mt-14">
          <PlansModuleTable catalog={catalog} />
        </div>

        <section className="mt-20" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-display text-2xl font-bold text-white md:text-3xl">
            Perguntas frequentes
          </h2>
          <dl className="mt-8 space-y-6">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question} className="rounded-xl border border-white/10 bg-card/40 p-6">
                <dt className="font-display font-semibold text-white">{item.question}</dt>
                <dd className="mt-2 text-muted-foreground">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-16 rounded-2xl border border-marketing-accent/30 bg-marketing-accent/5 p-8 text-center md:p-10">
          <p className="font-display text-xl font-semibold text-white">
            Quer uma proposta para sua concessionária?
          </p>
          <p className="mt-2 text-muted-foreground">
            Agende uma demonstração gratuita com nossa equipe comercial.
          </p>
          <Button
            className="mt-6 bg-marketing-accent text-zinc-950 hover:bg-marketing-accent/90"
            size="lg"
            asChild
          >
            <Link href="/contato">Agendar demonstração</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
