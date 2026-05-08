export type InternalDocPageSlug = "business-rules" | "technical";

export const INTERNAL_DOC_DB_SLUG: Record<InternalDocPageSlug, string> = {
  "business-rules": "business_rules",
  technical: "technical",
};

export const INTERNAL_DOC_FALLBACK_PATH_LABEL: Record<InternalDocPageSlug, string> =
  {
    "business-rules":
      "apps/admin-master/content/internal-docs/regras-de-negocio.md",
    technical:
      "apps/admin-master/content/internal-docs/documentacao-tecnica.md",
  };
