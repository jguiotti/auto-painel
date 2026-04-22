import type { Metadata } from "next";

import { StandaloneFinanceClient } from "@/components/storefront/standalone-finance-client";

export const metadata: Metadata = {
  title: "Simular financiamento",
  description: "Simule entrada, prazo e parcela para planejar a compra.",
};

export default function SimularFinanciamentoPage() {
  return <StandaloneFinanceClient />;
}
