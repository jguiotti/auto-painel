import {
  ArrowRight,
  Car,
  ChartColumn,
  Lock,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

export default function MarketingHomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-marketing-hero text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `linear-gradient(to right, oklch(1 0 0 / 0.06) 1px, transparent 1px),
              linear-gradient(to bottom, oklch(1 0 0 / 0.06) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 md:pb-28 md:pt-32">
          <Badge
            variant="secondary"
            className="mb-6 border-white/10 bg-white/10 text-white backdrop-blur-sm"
          >
            <Sparkles className="mr-1 size-3" aria-hidden />
            Feito para donos de concessionária
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Tecnologia de confiança para vender mais veículos com organização.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
            O AutoPainel reúne vitrine, estoque e leads em uma plataforma
            multitenant segura — cada loja isolada, seus dados protegidos.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button
              size="lg"
              className="bg-marketing-accent text-white shadow-lg hover:bg-marketing-accent/90"
              asChild
            >
              <Link href="/contato">
                Agendar demonstração
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10"
              asChild
            >
              <Link href="/funcionalidades">Ver funcionalidades</Link>
            </Button>
          </div>
          <ul className="mt-16 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Isolamento por loja",
                text: "RLS e políticas que impedem acesso cruzado entre concessionárias.",
              },
              {
                icon: Lock,
                title: "Dados sob controle",
                text: "Autenticação, papéis e trilhas claras para equipe e gestão.",
              },
              {
                icon: ChartColumn,
                title: "Operação integrada",
                text: "Estoque, contatos e presença digital no mesmo painel.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <Icon className="size-8 text-marketing-accent" aria-hidden />
                <p className="mt-3 font-semibold">{title}</p>
                <p className="mt-1 text-sm text-white/75">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Tudo o que a sua equipe precisa no dia a dia
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Menos planilhas soltas, mais previsibilidade na captação e no
            acompanhamento de interessados.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Car,
              title: "Estoque e vitrine",
              description:
                "Cadastro de veículos com slug público, mídias e status — pronto para divulgar.",
            },
            {
              icon: Sparkles,
              title: "Leads organizados",
              description:
                "Contatos chegam centralizados; sua equipe responde com contexto do veículo.",
            },
            {
              icon: Shield,
              title: "Multitenant nativo",
              description:
                "Uma infraestrutura, várias lojas: cada uma com seu branding e domínio.",
            },
          ].map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-border/80 transition-shadow hover:shadow-md">
              <CardHeader>
                <Icon className="size-10 text-marketing-accent" aria-hidden />
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="text-base">{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="mt-14 flex justify-center">
          <Button size="lg" asChild>
            <Link href="/funcionalidades">
              Explorar todas as funcionalidades
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Pronto para modernizar a gestão da sua concessionária?
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Fale com a gente e agende uma demonstração personalizada.
              </p>
            </div>
            <Button
              size="lg"
              className="shrink-0 bg-marketing-accent text-white hover:bg-marketing-accent/90"
              asChild
            >
              <Link href="/contato">Quero uma demonstração</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
