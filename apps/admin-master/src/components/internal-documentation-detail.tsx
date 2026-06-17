import Link from "next/link";

import { ChevronLeft } from "lucide-react";

import { InternalMarkdownDoc } from "@/components/internal-markdown-doc";
import { InternalDocSaveForm } from "@/components/internal-doc-save-form";
import {
  INTERNAL_DOC_DB_SLUG,
  INTERNAL_DOC_FALLBACK_PATH_LABEL,
  type InternalDocPageSlug,
} from "@/lib/internal-docs/internal-doc-slugs";
import { loadInternalDoc } from "@/lib/internal-docs/load-internal-doc";

interface InternalDocumentationDetailProps {
  pageSlug: InternalDocPageSlug;
  title: string;
  subtitle?: string;
  /** When true, hides the in-panel editor (docs are maintained in git only). */
  readOnly?: boolean;
}

export async function InternalDocumentationDetail({
  pageSlug,
  title,
  subtitle,
  readOnly = false,
}: InternalDocumentationDetailProps) {
  const { bodyMd, source, updatedAtIso } = await loadInternalDoc(pageSlug);
  const docSlugDb = INTERNAL_DOC_DB_SLUG[pageSlug];
  const fallbackLabel = INTERNAL_DOC_FALLBACK_PATH_LABEL[pageSlug];
  const contentVersionKey = `${docSlugDb}-${updatedAtIso ?? "filesystem"}`;
  const docVariant = pageSlug === "technical" ? "technical" : "onboarding";

  const defaultSubtitle =
    pageSlug === "business-rules"
      ? "Manual de onboarding para operar a plataforma — linguagem simples, sem jargão técnico."
      : pageSlug === "technical"
        ? "Referência para desenvolvedores: stack, APIs, integrações e deploy."
        : undefined;

  const sourceDescription = readOnly
    ? "Documentação de consulta — atualizada via repositório (git)."
    : source === "database"
      ? "Origem: base de dados (Supabase), restrita a operadores da plataforma via RLS."
      : `Origem: arquivo local de fallback (${fallbackLabel}).`;

  return (
    <div className="pb-12">
      <div className="mb-6">
        <Link
          href="/painel/documentacao"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden />
          Voltar para documentação interna
        </Link>
      </div>
      <header className="mb-10 rounded-xl border border-border bg-muted/30 px-6 py-8 sm:px-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {subtitle ?? defaultSubtitle}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">{sourceDescription}</p>
        {!readOnly && updatedAtIso ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Última atualização na base:{" "}
            <time dateTime={updatedAtIso}>
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(updatedAtIso))}
            </time>
          </p>
        ) : null}
      </header>
      <InternalMarkdownDoc markdown={bodyMd} variant={docVariant} />
      {!readOnly ? (
        <InternalDocSaveForm
          key={contentVersionKey}
          docSlugDb={docSlugDb}
          initialBodyMd={bodyMd}
        />
      ) : null}
    </div>
  );
}
