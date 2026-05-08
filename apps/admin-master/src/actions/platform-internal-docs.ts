"use server";

import { revalidatePath } from "next/cache";

import { fetchProfileRowForUserId } from "@/lib/auth/fetch-profile-for-admin";
import { isPlatformOperatorProfile } from "@/lib/auth/platform-operator-profile";
import { INTERNAL_DOC_DB_SLUG } from "@/lib/internal-docs/internal-doc-slugs";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PlatformInternalDocSaveState {
  ok?: boolean;
  error?: string;
}

const ALLOWED_DB_SLUGS = new Set(Object.values(INTERNAL_DOC_DB_SLUG));

export async function savePlatformInternalDocumentAction(
  _prev: PlatformInternalDocSaveState | null,
  formData: FormData,
): Promise<PlatformInternalDocSaveState> {
  const docSlug = String(formData.get("doc_slug") ?? "").trim();
  const bodyMd = String(formData.get("body_md") ?? "");

  if (!ALLOWED_DB_SLUGS.has(docSlug)) {
    return { error: "Documento inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  const { profile } = await fetchProfileRowForUserId(user.id);
  if (!isPlatformOperatorProfile(profile)) {
    return { error: "Sem permissão para editar esta documentação." };
  }

  const updatedAt = new Date().toISOString();

  const { error } = await supabase.from("platform_internal_documents").upsert(
    {
      doc_slug: docSlug,
      body_md: bodyMd,
      updated_at: updatedAt,
      updated_by: user.id,
    },
    { onConflict: "doc_slug" },
  );

  if (error) {
    return {
      error:
        error.message ??
        "Não foi possível salvar. Verifique se a migração foi aplicada no projeto Supabase.",
    };
  }

  revalidatePath("/painel/documentacao");
  revalidatePath("/painel/documentacao/regras-de-negocio");
  revalidatePath("/painel/documentacao/tecnica");

  return { ok: true };
}
