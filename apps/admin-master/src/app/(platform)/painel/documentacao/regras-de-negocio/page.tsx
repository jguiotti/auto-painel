import type { Metadata } from "next";

import { InternalDocumentationDetail } from "@/components/internal-documentation-detail";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Regras de negócio · Documentação interna",
};

export default function BusinessRulesDocumentationPage() {
  return (
    <InternalDocumentationDetail pageSlug="business-rules" title="Regras de negócio" />
  );
}
