import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import { MarketingJsonLd } from "@/components/marketing-json-ld";
import { BRAND_SLOGAN } from "@/lib/brand";
import { MARKETING_FAQ_ITEMS } from "@/lib/marketing-faq";
import { LEGAL_SITE_URL } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  description:
    "Tire dúvidas sobre planos, setup, prazo de configuração, vitrines demo e integrações do AutoPainel para concessionárias.",
  alternates: { canonical: `${LEGAL_SITE_URL}/perguntas-frequentes` },
  openGraph: {
    title: "Perguntas frequentes | AutoPainel",
    description:
      "Respostas sobre preços, onboarding em 1 dia, painel de gestão e vitrine whitelabel.",
    url: `${LEGAL_SITE_URL}/perguntas-frequentes`,
  },
};

export default function PerguntasFrequentesPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: MARKETING_FAQ_ITEMS.map((item) => ({
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
      <MarketingJsonLd pathname="/perguntas-frequentes" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
        <div>
          <p className="font-slogan text-sm text-marketing-accent">{BRAND_SLOGAN}</p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Perguntas frequentes
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Tudo o que donos de concessionária costumam perguntar antes de contratar — preços,
            prazo, configuração, vitrines demo e integrações.
          </p>
        </div>

        <dl className="mt-12 space-y-6">
          {MARKETING_FAQ_ITEMS.map((item) => (
            <div
              key={item.question}
              className="rounded-xl border border-white/10 bg-card/40 p-6"
            >
              <dt className="font-display text-lg font-semibold text-white">{item.question}</dt>
              <dd className="mt-3 text-base leading-relaxed text-muted-foreground">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 rounded-2xl border border-marketing-accent/30 bg-marketing-accent/5 p-8 text-center md:p-10">
          <p className="font-display text-xl font-semibold text-white">
            Ainda tem dúvidas?
          </p>
          <p className="mt-2 text-muted-foreground">
            Compare planos com preços transparentes ou fale com nossa equipe — configuramos sua
            loja em até um dia útil.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              className="bg-marketing-accent text-zinc-950 hover:bg-marketing-accent/90"
              size="lg"
              asChild
            >
              <Link href="/contato">Agendar demonstração</Link>
            </Button>
            <Button
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              size="lg"
              asChild
            >
              <Link href="/planos">Ver planos e módulos</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
