import type { Metadata } from "next";
import {
  Building2,
  Car,
  Cloud,
  Gauge,
  Headphones,
  LayoutDashboard,
  LineChart,
  MessageCircle,
  Palette,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Button, Card, CardDescription, CardHeader, CardTitle } from "@autopainel/shared/ui";

export const metadata: Metadata = {
  title: "Funcionalidades",
  description:
    "Conheça o que o AutoPainel oferece para estoque, leads, vitrine e operação multitenant.",
};

const features = [
  {
    icon: LayoutDashboard,
    title: "Painel da concessionária",
    description:
      "Visão consolidada de estoque, contatos e indicadores para decisões rápidas no dia a dia.",
  },
  {
    icon: Car,
    title: "Gestão de estoque",
    description:
      "Inclusão e edição de veículos com fotos, preço, slug público e status (disponível, vendido).",
  },
  {
    icon: MessageCircle,
    title: "Leads e contatos",
    description:
      "Registro de interessados vinculados aos veículos, com histórico para o time comercial.",
  },
  {
    icon: Palette,
    title: "Branding e vitrine",
    description:
      "Identidade por loja: tema, logo e experiência alinhada à sua marca no ambiente digital.",
  },
  {
    icon: Building2,
    title: "Domínio e multitenant",
    description:
      "Suporte a subdomínio na plataforma ou domínio próprio, com resolução segura por host.",
  },
  {
    icon: Users,
    title: "Equipe e papéis",
    description:
      "Perfis para administradores e vendedores, todos restritos aos dados da própria loja.",
  },
  {
    icon: LineChart,
    title: "Operação orientada a dados",
    description:
      "Base preparada para evoluir com métricas e relatórios conforme sua operação cresce.",
  },
  {
    icon: Gauge,
    title: "Performance e escalabilidade",
    description:
      "Arquitetura moderna com foco em tempo de resposta e experiência fluida no painel.",
  },
  {
    icon: Cloud,
    title: "Infraestrutura em nuvem",
    description:
      "Backend gerenciado com backups, segurança em camadas e atualizações contínuas.",
  },
  {
    icon: Headphones,
    title: "Suporte à adoção",
    description:
      "Demonstrações e materiais para sua equipe ganhar confiança na ferramenta desde o primeiro dia.",
  },
];

export default function FuncionalidadesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          O que o AutoPainel oferece
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Uma suíte pensada para donos e equipes de concessionárias que precisam de
          organização, segurança e uma presença digital profissional — sem abrir mão
          da autonomia de cada loja.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <Card
            key={title}
            className="border-border/80 transition-colors hover:border-marketing-accent/40 hover:shadow-md"
          >
            <CardHeader>
              <Icon className="size-9 text-marketing-accent" aria-hidden />
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                {description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-border bg-card p-8 text-center shadow-sm md:p-10">
        <p className="text-lg font-semibold">
          Quer ver o AutoPainel na prática na sua operação?
        </p>
        <p className="mt-2 text-muted-foreground">
          Solicite uma demonstração e receba um retorno da nossa equipe.
        </p>
        <Button
          className="mt-6 bg-marketing-accent text-white hover:bg-marketing-accent/90"
          size="lg"
          asChild
        >
          <Link href="/contato">Agendar demonstração</Link>
        </Button>
      </div>
    </div>
  );
}
