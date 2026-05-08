import type { Metadata } from "next";
import Link from "next/link";

import { BookOpen, ClipboardList, FileCode2 } from "lucide-react";

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
      title: "Regras de negócio",
      description:
        "PRDs vivos, regras de negócio numeradas e cenários de aceite produzidos pelo PM.",
      icon: ClipboardList,
    },
    {
      href: "/painel/documentacao/tecnica",
      title: "Documentação técnica",
      description:
        "Contratos API-first, dados, RLS em alto nível e referências aos tipos em packages/shared.",
      icon: FileCode2,
    },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="size-5 shrink-0" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Somente equipe interna
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Documentação interna</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Central para PRDs e registro técnico visível apenas para operadores da plataforma. O conteúdo
          é carregado de arquivos Markdown versionados no repositório.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="group block rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full transition-colors group-hover:bg-muted/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </div>
                <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
