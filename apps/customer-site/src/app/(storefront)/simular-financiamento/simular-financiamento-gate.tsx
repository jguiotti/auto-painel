import Link from "next/link";

import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";

import { StandaloneFinanceClient } from "@/components/storefront/standalone-finance-client";
import { getPlatformFinanceMonthlyRatePercent } from "@/lib/finance/get-platform-finance-rate";
import { getDealershipPublicRecord } from "@/lib/tenant/get-dealership-public-record";

export async function SimularFinanciamentoGate() {
  const dealership = await getDealershipPublicRecord();
  const monthlyRatePercent = await getPlatformFinanceMonthlyRatePercent();
  if (!dealership) {
    return null;
  }

  if (
    !isDealershipFeatureEnabled(
      dealership.enabled_features,
      "finance_simulator",
    )
  ) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">
          O simulador de financiamento não está disponível para esta loja.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-primary underline">
          Voltar à vitrine
        </Link>
      </div>
    );
  }

  return <StandaloneFinanceClient monthlyRatePercent={monthlyRatePercent} />;
}
