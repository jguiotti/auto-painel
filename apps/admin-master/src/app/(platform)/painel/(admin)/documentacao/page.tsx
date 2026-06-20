import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRight, BookOpen, FileCode2, GraduationCap } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Documentação interna · AutoPainel Admin",
};

export default function InternalDocumentationHubPage() {
  const sections = [
    {
      href: "/painel/documentacao/regras-de-negocio",
      title: "Manual de onboarding",
      badge: "Operações",
      description:
        "O que é a AutoPainel, como criar lojas, planos, módulos e o dia a dia no Admin — para toda a equipe.",
      icon: GraduationCap,
      accent: "border-l-4 border-l-emerald-500/80",
    },
    {
      href: "/painel/documentacao/tecnica",
      title: "Documentação técnica",
      badge: "Desenvolvimento",
      description:
        "Stack, instalação, Supabase, APIs, integrações, GTM e deploy — referência para devs e DevOps.",
      icon: FileCode2,
      accent: "border-l-4 border-l-sky-500/80",
    },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-10 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="size-5 shrink-0" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Equipe AutoPainel
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Documentação interna</h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Escolha o guia certo para o seu perfil. Tudo em linguagem clara, sempre atualizado a partir
          do repositório — sem formulários para preencher.
        </p>
      </div>

      <div className="grid gap-5">
        {sections.map(({ href, title, badge, description, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className="group block rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className={`transition-colors group-hover:bg-muted/50 ${accent}`}>
              <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {badge}
                  </span>
                  <CardTitle className="text-xl">{title}</CardTitle>
                  <CardDescription className="max-w-xl text-sm leading-relaxed">
                    {description}
                  </CardDescription>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-primary">
                  <Icon className="size-5 text-muted-foreground group-hover:text-primary" aria-hidden />
                  <span className="hidden sm:inline">Abrir</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
