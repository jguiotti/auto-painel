import type { Metadata } from "next";
import {
  Building2,
  Car,
  Globe,
  LayoutTemplate,
  Lock,
  MessageCircle,
  Palette,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Button, Card, CardDescription, CardHeader, CardTitle } from "@autopainel/shared/ui";

export const metadata: Metadata = {
  title: "Funcionalidades",
  description:
    "Site exclusivo, painel de gestão, estoque isolado, equipe com papéis, 3 layouts de vitrine, SEO e leads — tudo para concessionárias no AutoPainel.",
};

const featureGroups = [
  {
    title: "Sua loja, seu ambiente",
    intro:
      "Cada concessionária opera com site e painel dedicados. Multitenant de verdade: dados separados, acesso restrito à sua equipe.",
    items: [
      {
        icon: Building2,
        title: "Site + painel exclusivos",
        description:
          "Vitrine pública com a marca da loja e painel administrativo para estoque, leads e operação — um par único por concessionária.",
      },
      {
        icon: ShieldCheck,
        title: "Isolamento total de estoque",
        description:
          "Políticas de segurança em banco garantem que outra loja jamais enxergue seus veículos, preços ou contatos.",
      },
      {
        icon: Globe,
        title: "Domínio próprio ou subdomínio",
        description:
          "Resolução segura por host: o visitante sempre cai na vitrine certa, com endereço profissional da sua revenda.",
      },
    ],
  },
  {
    title: "Equipe e operação comercial",
    intro:
      "O dono define quem entra no painel e o que cada pessoa pode fazer — do gestor ao vendedor de piso.",
    items: [
      {
        icon: Users,
        title: "Gestão de colaboradores",
        description:
          "Cadastre vendedores e gestores com papéis (owner, manager, seller). Permissões claras para publicar, atender leads ou administrar a loja.",
      },
      {
        icon: Car,
        title: "Estoque e vitrine sincronizados",
        description:
          "Cadastre veículos com fotos, preço e página pública. Alterou no painel, reflete no site na hora — sem fila de agência.",
      },
      {
        icon: MessageCircle,
        title: "Leads centralizados",
        description:
          "Interessados chegam com contexto do veículo. Histórico para o comercial responder rápido e não perder oportunidade.",
      },
    ],
  },
  {
    title: "Marca e presença digital",
    intro:
      "Três layouts elegantes, variações de cor, logo e tipografia — para a vitrine transmitir confiança e diferenciação no mercado.",
    items: [
      {
        icon: LayoutTemplate,
        title: "3 modelos de vitrine",
        description:
          "Escolha o layout que combina com o posicionamento da loja. Tema claro ou escuro, cores e logos aplicados em todo o site.",
      },
      {
        icon: Palette,
        title: "Whitelabel completo",
        description:
          "Logo horizontal no header, destaque no rodapé, favicon e paleta personalizada. O cliente vê a sua concessionária, não a plataforma.",
      },
      {
        icon: Search,
        title: "SEO para concessionárias",
        description:
          "URLs amigáveis por veículo, metadados e estrutura pensada para buscadores — sua loja aparece quando o comprador pesquisa.",
      },
      {
        icon: Lock,
        title: "Infraestrutura em nuvem",
        description:
          "Backend gerenciado, backups e atualizações contínuas. Você foca em vender; a plataforma cuida da base técnica.",
      },
    ],
  },
] as const;

export default function FuncionalidadesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
      <div className="max-w-3xl">
        <p className="font-slogan text-sm font-medium uppercase tracking-wider text-marketing-accent">
          Funcionalidades
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
          Tudo o que sua concessionária precisa para vender online com controle
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Site profissional, painel de gestão, equipe organizada e SEO de qualidade —
          sem depender de agência todo mês e sem risco de misturar dados com outras lojas.
        </p>
      </div>

      <div className="mt-16 space-y-20">
        {featureGroups.map((group) => (
          <section key={group.title}>
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
                {group.title}
              </h2>
              <p className="mt-2 text-muted-foreground">{group.intro}</p>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map(({ icon: Icon, title, description }) => (
                <Card
                  key={title}
                  className="border-white/10 bg-card/60 transition-colors hover:border-marketing-accent/30 hover:shadow-lg hover:shadow-cyan-500/5"
                >
                  <CardHeader>
                    <Icon className="size-9 text-marketing-accent" aria-hidden />
                    <CardTitle className="font-display text-lg">{title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-white/10 bg-card/60 p-8 text-center shadow-sm md:p-10">
        <p className="font-display text-lg font-semibold text-white">
          Quer ver site, painel e equipe funcionando juntos na sua operação?
        </p>
        <p className="mt-2 text-muted-foreground">
          Compare planos com preços transparentes ou agende uma demonstração — mostramos vitrine,
          painel e proposta com setup incluído.
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
  );
}
