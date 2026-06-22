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
    "Compare planos Essencial, Profissional e Completo do AutoPainel. A partir de R$ 197/mês + setup único de R$ 497 — estoque, contatos, simulador e integrações.",
  alternates: { canonical: `${LEGAL_SITE_URL}/planos` },
  openGraph: {
    title: "Planos e módulos | AutoPainel",
    description:
      "Planos a partir de R$ 197/mês para concessionárias. Setup obrigatório R$ 497. Compare módulos e agende uma demonstração.",
    url: `${LEGAL_SITE_URL}/planos`,
  },
};

export default async function PlanosPage() {
  const catalog = await fetchPublicPricingCatalog();

  return (
    <>
      <MarketingJsonLd pathname="/planos" />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="font-slogan text-sm text-marketing-accent">{BRAND_SLOGAN}</p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Planos e módulos
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Monte a operação digital da sua loja com preços claros — sem surpresas. Mensalidade
            a partir de <strong className="text-zinc-300">R$ 197/mês</strong> e setup único
            obrigatório de <strong className="text-zinc-300">R$ 497</strong> (configuração
            completa + importação inicial). A faixa de plano depende do volume de veículos no
            estoque. Dúvidas? Veja a{" "}
            <Link
              href="/perguntas-frequentes"
              className="font-medium text-marketing-accent hover:underline"
            >
              página de perguntas frequentes
            </Link>
            .
          </p>
        </div>

        <div className="mt-14">
          <PlansModuleTable catalog={catalog} />
        </div>

        <div className="mt-16 rounded-2xl border border-marketing-accent/30 bg-marketing-accent/5 p-8 text-center md:p-10">
          <p className="font-display text-xl font-semibold text-white">
            Quer ver vitrine e painel na prática?
          </p>
          <p className="mt-2 text-muted-foreground">
            Explore as três vitrines demo na home ou agende uma demonstração guiada com acesso
            de teste ao painel.
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
              <Link href="/">Ver vitrines demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
