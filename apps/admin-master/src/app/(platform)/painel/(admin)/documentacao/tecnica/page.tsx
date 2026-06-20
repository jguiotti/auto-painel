import type { Metadata } from "next";

import { InternalDocumentationDetail } from "@/components/internal-documentation-detail";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Documentação técnica · Documentação interna",
};

export default function TechnicalDocumentationPage() {
  return (
    <InternalDocumentationDetail
      pageSlug="technical"
      title="Documentação técnica"
      readOnly
    />
  );
}
