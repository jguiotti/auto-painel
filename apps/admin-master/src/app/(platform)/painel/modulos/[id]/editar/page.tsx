import { notFound } from "next/navigation";

import { PricingCatalogSchemaWarning } from "@/components/pricing-catalog-schema-warning";
import { SaasModuleForm } from "@/components/saas-module-form";
import {
  fetchSaasModuleByIdForAdmin,
  getPricingCatalogSchemaState,
} from "@/lib/data/pricing-catalog";

export const dynamic = "force-dynamic";

interface EditarModuloPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarModuloPage({ params }: EditarModuloPageProps) {
  const schema = await getPricingCatalogSchemaState();

  if (schema.kind !== "ok") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pb-12 pt-6">
        <PricingCatalogSchemaWarning state={schema} />
      </div>
    );
  }

  const { id } = await params;
  const moduleRow = await fetchSaasModuleByIdForAdmin(id);
  if (!moduleRow) {
    notFound();
  }

  return <SaasModuleForm module={moduleRow} />;
}
