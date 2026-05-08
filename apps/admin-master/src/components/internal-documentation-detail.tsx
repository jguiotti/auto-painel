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
}

export async function InternalDocumentationDetail({
  pageSlug,
  title,
}: InternalDocumentationDetailProps) {
  const { bodyMd, source, updatedAtIso } = await loadInternalDoc(pageSlug);
  const docSlugDb = INTERNAL_DOC_DB_SLUG[pageSlug];
  const fallbackLabel = INTERNAL_DOC_FALLBACK_PATH_LABEL[pageSlug];
  const contentVersionKey = `${docSlugDb}-${updatedAtIso ?? "filesystem"}`;

  const sourceDescription =
    source === "database"
      ? "Origem: base de dados (Supabase), restrita a operadores da plataforma via RLS."
      : `Origem: arquivo local de fallback (${fallbackLabel}). Aplique a migração «platform_internal_documents» para gravar edições na base.`;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/painel/documentacao"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden />
          Voltar para documentação interna
        </Link>
      </div>
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{sourceDescription}</p>
        {updatedAtIso ? (
          <p className="text-xs text-muted-foreground">
            Última atualização na base:{" "}
            <time dateTime={updatedAtIso}>
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(updatedAtIso))}
            </time>
          </p>
        ) : null}
      </div>
      <InternalMarkdownDoc markdown={bodyMd} />
      <InternalDocSaveForm
        key={contentVersionKey}
        docSlugDb={docSlugDb}
        initialBodyMd={bodyMd}
      />
    </div>
  );
}
