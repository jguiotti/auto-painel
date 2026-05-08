import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  INTERNAL_DOC_DB_SLUG,
  type InternalDocPageSlug,
} from "@/lib/internal-docs/internal-doc-slugs";

const INTERNAL_DOC_FILES: Record<InternalDocPageSlug, string> = {
  "business-rules": "regras-de-negocio.md",
  technical: "documentacao-tecnica.md",
};

export type InternalDocLoadSource = "database" | "filesystem";

export interface InternalDocPayload {
  bodyMd: string;
  source: InternalDocLoadSource;
  updatedAtIso: string | null;
}

export async function loadInternalDoc(
  pageSlug: InternalDocPageSlug,
): Promise<InternalDocPayload> {
  const dbSlug = INTERNAL_DOC_DB_SLUG[pageSlug];

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("platform_internal_documents")
      .select("body_md, updated_at")
      .eq("doc_slug", dbSlug)
      .maybeSingle();

    if (!error && data?.body_md != null && String(data.body_md).length > 0) {
      return {
        bodyMd: String(data.body_md),
        source: "database",
        updatedAtIso: data.updated_at ?? null,
      };
    }
  } catch {
    // Table missing or transport errors — fall back to repo markdown.
  }

  const baseDir = path.join(process.cwd(), "content", "internal-docs");
  const fileName = INTERNAL_DOC_FILES[pageSlug];
  const filePath = path.join(baseDir, fileName);
  const bodyMd = await fs.readFile(filePath, "utf8");

  return {
    bodyMd,
    source: "filesystem",
    updatedAtIso: null,
  };
}
