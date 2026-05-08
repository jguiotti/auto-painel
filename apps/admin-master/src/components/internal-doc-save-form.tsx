"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button, Label, Textarea } from "@autopainel/shared/ui";

import {
  savePlatformInternalDocumentAction,
  type PlatformInternalDocSaveState,
} from "@/actions/platform-internal-docs";

interface InternalDocSaveFormProps {
  docSlugDb: string;
  initialBodyMd: string;
}

export function InternalDocSaveForm({
  docSlugDb,
  initialBodyMd,
}: InternalDocSaveFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    PlatformInternalDocSaveState | null,
    FormData
  >(savePlatformInternalDocumentAction, null);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state?.ok, router]);

  return (
    <section
      className="mt-10 rounded-lg border border-border bg-card p-4 shadow-sm"
      aria-labelledby="internal-doc-editor-heading"
    >
      <h2 id="internal-doc-editor-heading" className="mb-3 text-sm font-semibold">
        Editar documentação
      </h2>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="doc_slug" value={docSlugDb} />
        <div className="space-y-2">
          <Label htmlFor={`body_md_${docSlugDb}`}>Markdown</Label>
          <Textarea
            id={`body_md_${docSlugDb}`}
            name="body_md"
            defaultValue={initialBodyMd}
            rows={18}
            className="min-h-[280px] font-mono text-[13px] leading-relaxed"
            disabled={pending}
            spellCheck={false}
          />
        </div>
        {state?.error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {state?.ok ? (
          <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100">
            Alterações salvas na base de dados.
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </form>
    </section>
  );
}
