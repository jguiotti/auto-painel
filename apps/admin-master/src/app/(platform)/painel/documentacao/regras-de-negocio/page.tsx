import type { Metadata } from "next";

import { InternalDocumentationDetail } from "@/components/internal-documentation-detail";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manual de onboarding · Documentação interna",
};

export default function BusinessRulesDocumentationPage() {
  return (
    <InternalDocumentationDetail
      pageSlug="business-rules"
      title="Manual de onboarding"
      readOnly
    />
  );
}
